import type { PasarelaDePago, PreferenciaCreada, PreferenciaPago, DatosPagoPasarela } from './puerto'

interface PreferenciaGuardada extends PreferenciaCreada {
  externalId: string
}

export class PasarelaDePagoFake implements PasarelaDePago {
  private preferencias = new Map<string, PreferenciaGuardada>()
  private pagos = new Map<string, DatosPagoPasarela>()

  async crearPreferencia(preferencia: PreferenciaPago): Promise<PreferenciaCreada> {
    const preferenceId = `pref_fake_${preferencia.externalId}`
    const creada: PreferenciaGuardada = {
      preferenceId,
      initPoint: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${preferenceId}`,
      sandboxInitPoint: `https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=${preferenceId}`,
      externalId: preferencia.externalId,
    }
    this.preferencias.set(preferencia.externalId, creada)
    return creada
  }

  async obtenerPago(paymentId: string): Promise<DatosPagoPasarela> {
    const pago = this.pagos.get(paymentId)
    if (pago) return pago
    throw new Error(`Pago no encontrado en fake: ${paymentId}`)
  }

  /** Fixture: registra un pago con todos sus datos (monto, moneda, fecha). */
  simularPago(pago: DatosPagoPasarela): void {
    this.pagos.set(pago.paymentId, pago)
  }

  simularPagoAprobado(paymentId: string, externalReference: string): void {
    this.pagos.set(paymentId, {
      paymentId,
      status: 'approved',
      statusDetail: 'accredited',
      externalReference,
      dateApproved: new Date(),
      dateLastUpdated: new Date(),
    })
  }

  simularPagoPendiente(paymentId: string, externalReference: string): void {
    this.pagos.set(paymentId, {
      paymentId,
      status: 'pending',
      statusDetail: 'pending_waiting_payment',
      externalReference,
      dateCreated: new Date(),
      dateLastUpdated: new Date(),
    })
  }

  simularPagoRechazado(paymentId: string, externalReference: string): void {
    this.pagos.set(paymentId, {
      paymentId,
      status: 'rejected',
      statusDetail: 'cc_rejected',
      externalReference,
      dateLastUpdated: new Date(),
    })
  }
}