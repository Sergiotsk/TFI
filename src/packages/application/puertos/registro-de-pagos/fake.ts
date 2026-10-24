import {
  Pago,
  type DecisionDeAcreditacion,
  type EstadoDePago,
  type PagoInformado,
  type ReferenciaDePago,
} from '@tfi/domain'
import type { RegistroDeCargasFake } from '../registro-de-cargas/fake'
import type { Reloj } from '../reloj/puerto'
import type { RepositorioDePeriodos } from '../repositorio-de-periodos/puerto'
import type { RepositorioDePostulaciones } from '../repositorio-de-postulaciones/puerto'
import type { RegistroDePagos, ResultadoDeAcreditacion } from './puerto'

/**
 * Registro de pagos en memoria.
 *
 * Reproduce las garantías de la RPC `acreditar_pago`: idempotencia por
 * referencia, precondición sobre el estado persistido y cupo al confirmar. Las
 * acreditaciones pasan de a una por una cola, que hace de lock del período: dos
 * confirmaciones simultáneas por el último cupo no pueden pasar las dos.
 */
export class RegistroDePagosFake implements RegistroDePagos {
  private readonly pagos = new Map<string, Pago>()
  private cola: Promise<unknown> = Promise.resolve()
  private siguiente = 1

  constructor(
    private readonly postulaciones: RepositorioDePostulaciones,
    private readonly periodos: RepositorioDePeriodos,
    private readonly cargas: RegistroDeCargasFake,
    private readonly reloj: Reloj,
  ) {}

  registrarAcreditacion(
    pago: PagoInformado,
    decision: DecisionDeAcreditacion,
    cargaId?: string,
  ): Promise<ResultadoDeAcreditacion> {
    const turno = this.cola.then(() => this.acreditar(pago, decision, cargaId))
    this.cola = turno.catch(() => undefined)
    return turno
  }

  async existe(referencia: ReferenciaDePago): Promise<Pago | null> {
    return this.pagos.get(clave(referencia)) ?? null
  }

  async listarPorEstado(institucionId: string, estado: EstadoDePago): Promise<Pago[]> {
    const encontrados: Pago[] = []
    for (const pago of this.pagos.values()) {
      if (pago.estado !== estado) continue
      if ((await this.institucionDe(pago)) === institucionId) encontrados.push(pago)
    }
    return encontrados
  }

  private async acreditar(
    informado: PagoInformado,
    decision: DecisionDeAcreditacion,
    cargaId?: string,
  ): Promise<ResultadoDeAcreditacion> {
    const existente = this.pagos.get(clave(informado.referencia))
    if (existente) return { tipo: 'DUPLICADO', pagoExistente: existente }

    const ahora = this.reloj.ahora()

    if (decision.tipo === 'NO_IMPUTAR') {
      return this.guardar(informado, 'NO_IMPUTADO', ahora, {
        motivoNoImputado: decision.motivo,
        postulacionId: decision.postulacionId,
        cargaId,
      })
    }

    const postulacion = await this.postulaciones.obtenerPorId(decision.postulacionId)
    if (!postulacion || postulacion.estado !== decision.estadoEsperado) return { tipo: 'CONFLICTO' }

    if (decision.tipo === 'CONFIRMAR') {
      const periodo = await this.periodos.obtenerPorId(postulacion.periodoId)
      if (!periodo) return { tipo: 'CONFLICTO' }
      if ((await this.periodos.contarOcupados(periodo.id)) >= periodo.totalCupos) {
        return { tipo: 'CONFLICTO' }
      }

      const guardado = await this.postulaciones.guardarTransicion(postulacion, postulacion.confirmar(ahora))
      if (guardado === 'conflicto') return { tipo: 'CONFLICTO' }

      return this.guardar(informado, 'ACREDITADO', ahora, { postulacionId: postulacion.id, cargaId })
    }

    const enRevision = postulacion.pasarARevision(decision.motivo, ahora)
    const guardado = await this.postulaciones.guardarTransicion(postulacion, enRevision)
    if (guardado === 'conflicto') return { tipo: 'CONFLICTO' }

    return this.guardar(informado, 'A_DECIDIR', ahora, {
      motivoRevision: decision.motivo,
      postulacionId: postulacion.id,
      cargaId,
    })
  }

  private guardar(
    informado: PagoInformado,
    estado: EstadoDePago,
    ahora: Date,
    opcionales: Pick<Pago, 'motivoRevision' | 'motivoNoImputado' | 'postulacionId' | 'cargaId'>,
  ): ResultadoDeAcreditacion {
    const pago = new Pago(
      `pago-${this.siguiente++}`,
      informado.referencia,
      informado.monto,
      informado.pagadoEl,
      ahora,
      estado,
      { ...opcionales, dniInformado: informado.dni, numeroInformado: informado.numero },
    )
    this.pagos.set(clave(informado.referencia), pago)
    return { tipo: 'REGISTRADO', pago }
  }

  private async institucionDe(pago: Pago): Promise<string | undefined> {
    if (pago.postulacionId !== undefined) {
      const postulacion = await this.postulaciones.obtenerPorId(pago.postulacionId)
      const periodo = postulacion ? await this.periodos.obtenerPorId(postulacion.periodoId) : null
      if (periodo) return periodo.institucionId
    }
    return pago.cargaId !== undefined ? this.cargas.institucionDe(pago.cargaId) : undefined
  }
}

function clave(referencia: ReferenciaDePago): string {
  return `${referencia.proveedor}:${referencia.referenciaExterna}`
}
