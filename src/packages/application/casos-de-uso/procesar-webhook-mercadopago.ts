import type { Reloj } from '../puertos/reloj/puerto'
import type { RepositorioDePostulaciones } from '../puertos/repositorio-de-postulaciones/puerto'
import type { RepositorioDePeriodos } from '../puertos/repositorio-de-periodos/puerto'
import type { PasarelaDePago } from '../puertos/pasarela-de-pago/puerto'
import type { AccionesDelPersonal } from '../puertos/acciones-del-personal/puerto'
import type { RepositorioDeIntencionesDePago } from '../puertos/repositorio-de-intenciones-de-pago/puerto'

export interface ResultadoWebhookPago {
  procesado: boolean
  yaProcesado: boolean
  acreditado: boolean
  postulacionId?: string
}

/**
 * Procesa webhook de MercadoPago de forma idempotente.
 * Debe validar consultando la API de MP antes de acreditar.
 * Ambos caminos (manual + pasarela) terminan acreditando el pago.
 */
export class ProcesarWebhookMercadoPagoUseCase {
  constructor(
    private readonly postulaciones: RepositorioDePostulaciones,
    private readonly periodos: RepositorioDePeriodos,
    private readonly pasarela: PasarelaDePago,
    private readonly accionesDelPersonal: AccionesDelPersonal,
    private readonly reloj: Reloj,
    private readonly intenciones: RepositorioDeIntencionesDePago,
    private readonly yaProcesado?: (paymentId: string, webhookEventId?: string) => Promise<boolean>,
    private readonly marcarProcesado?: (params: {
      paymentId: string
      webhookEventId?: string
      externalReference?: string
      postulacionId?: string
    }) => Promise<void>,
  ) {}

  async ejecutar(params: {
    paymentId: string
    webhookEventId?: string
    topic?: string
  }): Promise<ResultadoWebhookPago> {
    if (!params.paymentId) {
      return { procesado: false, yaProcesado: false, acreditado: false }
    }

    const yaPorPago = await this.intenciones.obtenerPorPaymentIdMp(params.paymentId)
    if (yaPorPago?.estado === 'COMPLETADA') {
      return { procesado: true, yaProcesado: true, acreditado: false, postulacionId: yaPorPago.postulacionId }
    }

    const datos = await this.pasarela.obtenerPago(params.paymentId)

    if (datos.status !== 'approved') {
      if (datos.externalReference) {
        try {
          await this.intenciones.marcarProcesada({
            externalId: datos.externalReference,
            paymentIdMp: params.paymentId,
            webhookEventId: params.webhookEventId,
          })
        } catch {
          // Ignorar errores al marcar como procesada
        }
      }
      return { procesado: true, yaProcesado: false, acreditado: false }
    }

    const externalReference = datos.externalReference
    if (!externalReference) {
      return { procesado: true, yaProcesado: false, acreditado: false }
    }

    const intencion = await this.intenciones.obtenerPorExternalId(externalReference)
    if (!intencion) {
      return { procesado: true, yaProcesado: false, acreditado: false }
    }
    if (intencion.estado === 'COMPLETADA') {
      return { procesado: true, yaProcesado: true, acreditado: false, postulacionId: intencion.postulacionId }
    }

    const ahora = this.reloj.ahora()
    let acreditado = false
    try {
      const acciones = this.accionesDelPersonal as { confirmarVacante?: (postulacionId: string) => Promise<{ resultado?: string } | undefined> }
      if (typeof acciones.confirmarVacante === 'function') {
        const result = await acciones.confirmarVacante(intencion.postulacionId)
        acreditado = result?.resultado === 'OK'
      }
    } catch {
      // Ignorar errores al acreditar
    }

    if (acreditado) {
      try {
        await this.intenciones.marcarCompletada({
          externalId: externalReference,
          paymentIdMp: params.paymentId,
          webhookEventId: params.webhookEventId,
          pagadoEl: datos.dateApproved ?? ahora,
        })
      } catch {
        // Ignorar errores al marcar como completada
      }
      return { procesado: true, yaProcesado: false, acreditado: true, postulacionId: intencion.postulacionId }
    }

    try {
      await this.intenciones.marcarProcesada({
        externalId: externalReference,
        paymentIdMp: params.paymentId,
        webhookEventId: params.webhookEventId,
        pagadoEl: datos.dateApproved ?? ahora,
      })
    } catch {
      // Ignorar errores al marcar como procesada
    }
    return { procesado: true, yaProcesado: false, acreditado: false, postulacionId: intencion.postulacionId }
  }
}