import { ocupaCupo } from '@tfi/domain'
import type { Reloj } from '../puertos/reloj/puerto'
import type { RepositorioDePostulaciones } from '../puertos/repositorio-de-postulaciones/puerto'
import type { PasarelaDePago, DatosPagoPasarela } from '../puertos/pasarela-de-pago/puerto'
import type { AccionesDelPersonal } from '../puertos/acciones-del-personal/puerto'
import type {
  IntencionDePago,
  RepositorioDeIntencionesDePago,
} from '../puertos/repositorio-de-intenciones-de-pago/puerto'

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
 *
 * Los errores de infraestructura se propagan para que el route handler
 * responda 5xx y MercadoPago reintente. Solo se responde 200 cuando la
 * notificación quedó resuelta (acreditada, ya procesada o descartada por
 * negocio).
 */
export class ProcesarWebhookMercadoPagoUseCase {
  constructor(
    private readonly postulaciones: RepositorioDePostulaciones,
    private readonly pasarela: PasarelaDePago,
    private readonly accionesDelPersonal: AccionesDelPersonal,
    private readonly reloj: Reloj,
    private readonly intenciones: RepositorioDeIntencionesDePago,
  ) {}

  async ejecutar(params: { paymentId: string; webhookEventId?: string }): Promise<ResultadoWebhookPago> {
    if (!params.paymentId) {
      return { procesado: false, yaProcesado: false, acreditado: false }
    }

    const yaPorPago = await this.intenciones.obtenerPorPaymentIdMp(params.paymentId)
    if (yaPorPago?.estado === 'COMPLETADA') {
      return {
        procesado: true,
        yaProcesado: true,
        acreditado: false,
        postulacionId: yaPorPago.postulacionId,
      }
    }

    const datos = await this.pasarela.obtenerPago(params.paymentId)

    if (datos.status !== 'approved') {
      if (datos.externalReference) {
        await this.intenciones.marcarProcesada({
          externalId: datos.externalReference,
          paymentIdMp: params.paymentId,
          webhookEventId: params.webhookEventId,
        })
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
      return {
        procesado: true,
        yaProcesado: true,
        acreditado: false,
        postulacionId: intencion.postulacionId,
      }
    }

    const ahora = this.reloj.ahora()

    // Nunca acreditar un pago por un monto distinto al de la preferencia: si
    // alguien manipuló el checkout, el webhook no puede confirmar la vacante.
    if (!this.montoValido(datos, intencion)) {
      await this.intenciones.marcarProcesada({
        externalId: externalReference,
        paymentIdMp: params.paymentId,
        webhookEventId: params.webhookEventId,
        pagadoEl: datos.dateApproved ?? ahora,
      })
      return {
        procesado: true,
        yaProcesado: false,
        acreditado: false,
        postulacionId: intencion.postulacionId,
      }
    }

    const confirmacion = await this.accionesDelPersonal.confirmarVacante(intencion.postulacionId)
    const acreditado =
      confirmacion.resultado === 'OK' ||
      (confirmacion.resultado === 'CONFLICTO' && (await this.yaOcupaCupo(intencion.postulacionId, ahora)))

    if (acreditado) {
      await this.intenciones.marcarCompletada({
        externalId: externalReference,
        paymentIdMp: params.paymentId,
        webhookEventId: params.webhookEventId,
        pagadoEl: datos.dateApproved ?? ahora,
      })
      return {
        procesado: true,
        yaProcesado: false,
        acreditado: true,
        postulacionId: intencion.postulacionId,
      }
    }

    // SIN_CUPO, Postulación inexistente o transición inválida: el webhook quedó
    // procesado, pero no se acreditó. No se reintenta automáticamente porque
    // el resultado no cambia; queda para revisión del personal.
    await this.intenciones.marcarProcesada({
      externalId: externalReference,
      paymentIdMp: params.paymentId,
      webhookEventId: params.webhookEventId,
      pagadoEl: datos.dateApproved ?? ahora,
    })
    return {
      procesado: true,
      yaProcesado: false,
      acreditado: false,
      postulacionId: intencion.postulacionId,
    }
  }

  private montoValido(datos: DatosPagoPasarela, intencion: IntencionDePago): boolean {
    // Para acreditar, el pago tiene que traer monto y moneda: si faltan, no se
    // puede demostrar que corresponden a la intención.
    if (datos.transactionAmountCentavos === undefined || datos.currencyId === undefined) {
      return false
    }

    return (
      datos.transactionAmountCentavos === intencion.montoCentavos && datos.currencyId === 'ARS'
    )
  }

  /**
   * Si el pago ya se había acreditado pero falló el guardado de la intención,
   * el reintento de MP recibe CONFLICTO. La Postulación ya confirmada indica
   * que el pago sí se imputó: se completa la intención para cortar el ciclo.
   */
  private async yaOcupaCupo(postulacionId: string, ahora: Date): Promise<boolean> {
    const postulacion = await this.postulaciones.obtenerPorId(postulacionId)

    return postulacion !== null && ocupaCupo(postulacion.estadoEn(ahora))
  }
}
