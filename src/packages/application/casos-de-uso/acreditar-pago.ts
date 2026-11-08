import {
  Dni,
  evaluarPago,
  motivoParaIgnorar,
  type Candidata,
  type DecisionDeAcreditacion,
  type Imputacion,
  type MotivoIgnorado,
  type Pago,
  type PagoInformado,
  type Postulacion,
} from '@tfi/domain'
import { MAXIMO_POR_PAGINA } from '../paginacion'
import type { RegistroDePagos } from '../puertos/registro-de-pagos/puerto'
import type { RepositorioDePerfiles } from '../puertos/repositorio-de-perfiles/puerto'
import type { RepositorioDePeriodos } from '../puertos/repositorio-de-periodos/puerto'
import type { RepositorioDePostulaciones } from '../puertos/repositorio-de-postulaciones/puerto'
import type { Actor } from './actor'
import { exigirRol } from './actor'
import { ConflictoDeEstado } from './errores'

/** Reintentos ante un conflicto de concurrencia (research R2). */
const INTENTOS = 3

export type ResultadoDeAcreditacionDePago =
  | { resultado: 'ACREDITADO' | 'A_DECIDIR' | 'NO_IMPUTADO'; pago: Pago }
  | { resultado: 'DUPLICADO'; pago: Pago }
  | { resultado: 'IGNORADO'; motivo: MotivoIgnorado }

/** La imputación y, si se buscó por DNI, todas las Postulaciones de ese DNI. */
interface ImputacionDelPago {
  imputacion: Imputacion
  delDni: readonly Postulacion[] | null
}

/**
 * Acredita un pago informado (una fila del informe de pagos).
 *
 * Imputa el pago a una Postulación, le pide la decisión al dominio
 * (`evaluarPago`) y la persiste con `RegistroDePagos`, que verifica en la base
 * que las precondiciones sigan valiendo. Si no valen (otro pago se llevó el
 * último cupo, la Postulación cambió), relee y vuelve a decidir, hasta 3 veces.
 * Agotados los intentos falla: la fila se reprocesa y la idempotencia por
 * referencia lo hace seguro.
 *
 * La imputación va primero por número de Postulación y, si no hay número o no
 * existe, por DNI. Por DNI se prefieren las Postulaciones con un pago iniciado
 * (`PAGO_PENDIENTE` o `VENCIDO`); si no hay ninguna se usan todas las del
 * aspirante, así un pago doble queda `YA_TIENE_PAGO` y no como desconocido.
 *
 * El informe de SysAdmin trae también las cuotas de quienes ya cursan. Si una
 * fila de ese informe se imputa por DNI y el DNI no tiene Postulaciones, o todas
 * ya ocupan cupo, se ignora: no se registra ningún pago (ADR 0011).
 */
export class AcreditarPagoUseCase {
  constructor(
    private readonly postulaciones: RepositorioDePostulaciones,
    private readonly periodos: RepositorioDePeriodos,
    private readonly perfiles: RepositorioDePerfiles,
    private readonly pagos: RegistroDePagos,
  ) {}

  async ejecutar(actor: Actor, pago: PagoInformado, cargaId?: string): Promise<ResultadoDeAcreditacionDePago> {
    exigirRol(actor, 'TESORERIA')

    const existente = await this.pagos.existe(pago.referencia)
    if (existente) return { resultado: 'DUPLICADO', pago: existente }

    for (let intento = 0; intento < INTENTOS; intento += 1) {
      const { imputacion, delDni } = await this.imputar(pago)
      const motivo = pago.referencia.proveedor === 'INFORME_SYSADMIN' && delDni ? motivoParaIgnorar(delDni) : null
      if (motivo) return { resultado: 'IGNORADO', motivo }

      const decision = await this.decidir(pago, imputacion)
      const registro = await this.pagos.registrarAcreditacion(pago, decision, cargaId)

      if (registro.tipo === 'REGISTRADO') {
        return { resultado: aResultado(registro.pago), pago: registro.pago }
      }
      if (registro.tipo === 'DUPLICADO') {
        return { resultado: 'DUPLICADO', pago: registro.pagoExistente }
      }
    }

    throw new ConflictoDeEstado(
      `No se pudo acreditar el pago ${pago.referencia.referenciaExterna} después de ${INTENTOS} intentos`,
    )
  }

  private async decidir(pago: PagoInformado, imputacion: Imputacion): Promise<DecisionDeAcreditacion> {
    const [primera] = imputacion.candidatas
    if (primera === undefined) return { tipo: 'NO_IMPUTAR', motivo: 'REFERENCIA_DESCONOCIDA' }

    const periodo = await this.periodos.obtenerPorId(primera.postulacion.periodoId)
    if (!periodo) return { tipo: 'NO_IMPUTAR', motivo: 'REFERENCIA_DESCONOCIDA' }

    const ocupados = await this.periodos.contarOcupados(periodo.id)
    return evaluarPago(pago, imputacion, periodo, ocupados)
  }

  private async imputar(pago: PagoInformado): Promise<ImputacionDelPago> {
    if (pago.numero !== undefined) {
      const postulacion = await this.postulaciones.obtenerPorNumero(pago.numero)
      const candidata = postulacion ? await this.conDniDelAspirante(postulacion) : null
      if (candidata) return { imputacion: { via: 'NUMERO', candidatas: [candidata] }, delDni: null }
    }

    if (pago.dni === undefined) return { imputacion: { via: 'DNI', candidatas: [] }, delDni: [] }

    const { items } = await this.postulaciones.buscarPorDni(pago.dni.valor, {
      pagina: 1,
      porPagina: MAXIMO_POR_PAGINA,
    })
    const conPagoIniciado = items.filter((p) => p.estado === 'PAGO_PENDIENTE' || p.estado === 'VENCIDO')
    const elegidas = conPagoIniciado.length > 0 ? conPagoIniciado : items
    const dni = pago.dni

    return {
      imputacion: { via: 'DNI', candidatas: elegidas.map((postulacion) => ({ postulacion, dniDelAspirante: dni })) },
      delDni: items,
    }
  }

  private async conDniDelAspirante(postulacion: Postulacion): Promise<Candidata | null> {
    const perfil = await this.perfiles.obtenerPorId(postulacion.aspiranteId)
    return perfil ? { postulacion, dniDelAspirante: new Dni(perfil.dni) } : null
  }
}

function aResultado(pago: Pago): 'ACREDITADO' | 'A_DECIDIR' | 'NO_IMPUTADO' {
  if (pago.estado === 'DEVUELTO') {
    throw new Error('Un pago recién registrado no puede estar DEVUELTO')
  }
  return pago.estado
}
