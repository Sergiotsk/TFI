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

interface IntencionReutilizable {
  externalId: string
  preferenceId: string
  initPoint: string
  sandboxInitPoint?: string
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
    private readonly intenciones: RepositorioDeIntencionesDePago,
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

    const estadoEfectivo = postulacion.estadoEn(ahora)
    // Un reintento con el plazo todavía vigente no cambia de estado: la fila ya
    // está en PAGO_PENDIENTE y el trigger no acepta esa transición. Tampoco se
    // reinicia el vencimiento: el plazo original sigue corriendo.
    const esReintento = estadoEfectivo === 'PAGO_PENDIENTE'

    const vigente =
      estadoEfectivo === postulacion.estado ? postulacion : postulacion.vencer(ahora)
    const enPago = esReintento
      ? vigente
      : vigente.iniciarPago(periodo.calcularVencimiento(ahora), ahora)

    const ocupados = await this.periodos.contarOcupados(periodo.id)
    const pendientesVigentes = await this.periodos.contarPendientesVigentes(periodo.id, ahora)
    // En un reintento la propia Postulación ya figura como pendiente: si se
    // contara dos veces, un período con el último lugar ocupado por ella misma
    // devolvería SIN_CUPOS y el aspirante no podría volver a pagar.
    const pendientesQueOcupan = esReintento
      ? Math.max(0, pendientesVigentes - 1)
      : pendientesVigentes
    if (periodo.cuposLibres(ocupados, pendientesQueOcupan) <= 0) {
      throw new SinCuposParaIniciar(periodo.id)
    }

    if (!esReintento) {
      if (vigente !== postulacion) {
        const vencimiento = await this.postulaciones.guardarTransicion(postulacion, vigente)
        if (vencimiento === 'conflicto') throw new ConflictoDeEstado()
      }

      const guardado = await this.postulaciones.guardarTransicion(vigente, enPago)
      if (guardado === 'conflicto') throw new ConflictoDeEstado()
    }

    const reutilizable = await this.buscarIntencionReutilizable(
      enPago.id,
      periodo.montoMatricula.centavos,
      ahora,
    )
    if (reutilizable) {
      return {
        postulacion: aPostulacionConsultada(enPago, ahora),
        preferenceId: reutilizable.preferenceId,
        initPoint: reutilizable.initPoint,
        sandboxInitPoint: reutilizable.sandboxInitPoint,
        externalId: reutilizable.externalId,
      }
    }

    const externalId = this.generarExternalId()
    const urls = this.obtenerUrls(externalId)

    const preferencia = await this.pasarela.crearPreferencia({
      externalId,
      postulacionId: enPago.id,
      titulo: `Matrícula - Postulación ${enPago.numero.formatear()}`,
      monto: periodo.montoMatricula,
      backUrls: urls.backUrls,
      notificationUrl: urls.notificationUrl,
    })

    // Si no se puede guardar la intención, el webhook después no puede imputar
    // el pago. Es preferible fallar acá (antes del checkout) que cobrar a ciegas.
    await this.intenciones.crear({
      postulacionId: enPago.id,
      periodoId: periodo.id,
      institucionId: periodo.institucionId,
      montoCentavos: periodo.montoMatricula.centavos,
      externalId,
      preferenceId: preferencia.preferenceId,
      initPoint: preferencia.initPoint,
      sandboxInitPoint: preferencia.sandboxInitPoint,
      expiraEl: enPago.venceEl,
    })

    return {
      postulacion: aPostulacionConsultada(enPago, ahora),
      preferenceId: preferencia.preferenceId,
      initPoint: preferencia.initPoint,
      sandboxInitPoint: preferencia.sandboxInitPoint,
      externalId,
    }
  }

  private async buscarIntencionReutilizable(
    postulacionId: string,
    montoCentavos: number,
    ahora: Date,
  ): Promise<IntencionReutilizable | null> {
    try {
      const pendiente = await this.intenciones.obtenerPendientePorPostulacion(postulacionId, ahora)
      if (
        pendiente &&
        pendiente.preferenceId !== null &&
        pendiente.initPoint !== null &&
        pendiente.montoCentavos === montoCentavos
      ) {
        return {
          externalId: pendiente.externalId,
          preferenceId: pendiente.preferenceId,
          initPoint: pendiente.initPoint,
          sandboxInitPoint: pendiente.sandboxInitPoint ?? undefined,
        }
      }
    } catch {
      // Si la lectura falla, se sigue con una intención nueva.
    }

    return null
  }
}
