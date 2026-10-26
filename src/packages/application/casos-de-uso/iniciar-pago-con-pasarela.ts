import { PeriodoCerrado, SinCuposParaIniciar } from '@tfi/domain'
import type { Reloj } from '../puertos/reloj/puerto'
import type { RepositorioDePeriodos } from '../puertos/repositorio-de-periodos/puerto'
import type { RepositorioDePostulaciones } from '../puertos/repositorio-de-postulaciones/puerto'
import type { PasarelaDePago } from '../puertos/pasarela-de-pago/puerto'
import type { RepositorioDeIntencionesDePago } from '../puertos/repositorio-de-intenciones-de-pago/puerto'
import type { Actor } from './actor'
import { exigirRol } from './actor'
import { ConflictoDeEstado, NoAutorizado, NoEncontrado } from './errores'
import { aPostulacionConsultada } from './postulacion-consultada'
import type { PostulacionConsultada } from './postulacion-consultada'

export interface IniciarPagoConPasarelaResultado {
  postulacion: PostulacionConsultada
  preferenceId: string
  initPoint: string
  sandboxInitPoint?: string
  externalId: string
}

/**
 * Inicia el pago con pasarela (MercadoPago). Paralelo al flujo manual.
 * No reemplaza IniciarPagoUseCase: ambos habilitan el pago respetando reglas.
 */
export class IniciarPagoConPasarelaUseCase {
  constructor(
    private readonly postulaciones: RepositorioDePostulaciones,
    private readonly periodos: RepositorioDePeriodos,
    private readonly pasarela: PasarelaDePago,
    private readonly reloj: Reloj,
    private readonly generarExternalId: () => string,
    private readonly obtenerUrls: (externalId: string) => {
      backUrls: { success: string; pending: string; failure: string }
      notificationUrl: string
    },
    private readonly intenciones?: RepositorioDeIntencionesDePago,
  ) {}

  async ejecutar(actor: Actor, postulacionId: string): Promise<IniciarPagoConPasarelaResultado> {
    exigirRol(actor, 'ASPIRANTE')

    const postulacion = await this.postulaciones.obtenerPorId(postulacionId)
    if (!postulacion) throw new NoEncontrado('La Postulación no existe')
    if (postulacion.aspiranteId !== actor.perfilId) throw new NoAutorizado()

    const periodo = await this.periodos.obtenerPorId(postulacion.periodoId)
    if (!periodo) throw new NoEncontrado('El período de ingreso no existe')

    const ahora = this.reloj.ahora()
    if (!periodo.estaAbierto(ahora)) throw new PeriodoCerrado(periodo.id)

    const vigente =
      postulacion.estadoEn(ahora) === postulacion.estado
        ? postulacion
        : postulacion.vencer(ahora)
    const enPago = vigente.iniciarPago(periodo.calcularVencimiento(ahora), ahora)

    const ocupados = await this.periodos.contarOcupados(periodo.id)
    const pendientesVigentes = await this.periodos.contarPendientesVigentes(periodo.id, ahora)
    if (periodo.cuposLibres(ocupados, pendientesVigentes) <= 0) {
      throw new SinCuposParaIniciar(periodo.id)
    }

    const externalId = this.generarExternalId()
    const urls = this.obtenerUrls(externalId)

    // La preferencia se crea antes de guardar la transición: si Mercado Pago falla, la Postulación no queda
    // en PAGO_PENDIENTE sin preferencia (y sin poder reintentar, porque solo se inicia desde PREINSCRIPTO o VENCIDO).
    const preferencia = await this.pasarela.crearPreferencia({
      externalId,
      postulacionId: enPago.id,
      titulo: `Matrícula - Postulación ${enPago.numero.formatear()}`,
      monto: periodo.montoMatricula,
      backUrls: urls.backUrls,
      notificationUrl: urls.notificationUrl,
    })

    if (vigente !== postulacion) {
      const vencimiento = await this.postulaciones.guardarTransicion(postulacion, vigente)
      if (vencimiento === 'conflicto') throw new ConflictoDeEstado()
    }

    const guardado = await this.postulaciones.guardarTransicion(vigente, enPago)
    if (guardado === 'conflicto') throw new ConflictoDeEstado()

    if (this.intenciones) {
      try {
        await this.intenciones.crear({
          postulacionId: enPago.id,
          periodoId: periodo.id,
          institucionId: periodo.institucionId,
          montoCentavos: periodo.montoMatricula.centavos,
          externalId,
          preferenceId: preferencia.preferenceId,
          initPoint: preferencia.initPoint,
          sandboxInitPoint: preferencia.sandboxInitPoint,
        })
      } catch {
        // No romper el flujo si falla el guardado de intención
      }
    }

    return {
      postulacion: aPostulacionConsultada(enPago, ahora),
      preferenceId: preferencia.preferenceId,
      initPoint: preferencia.initPoint,
      sandboxInitPoint: preferencia.sandboxInitPoint,
      externalId,
    }
  }
}