import type {
  DatosPagoPasarela,
  PasarelaDePago,
  PreferenciaCreada,
  PreferenciaPago,
} from '../../../../packages/application/puertos/pasarela-de-pago/puerto'

export interface ConfiguracionMercadoPago {
  accessToken: string
  baseUrl?: string
  integratorId?: string
  platformId?: string
}

export class MercadoPagoAdapter implements PasarelaDePago {
  private readonly baseUrl: string

  constructor(private readonly config: ConfiguracionMercadoPago) {
    this.baseUrl = config.baseUrl ?? 'https://api.mercadopago.com'
  }

  async crearPreferencia(preferencia: PreferenciaPago): Promise<PreferenciaCreada> {
    const body = {
      items: [
        {
          title: preferencia.titulo,
          description: preferencia.descripcion ?? preferencia.titulo,
          quantity: 1,
          currency_id: preferencia.moneda ?? 'ARS',
          unit_price: preferencia.monto.centavos / 100,
        },
      ],
      external_reference: preferencia.externalId,
      back_urls: preferencia.backUrls,
      notification_url: preferencia.notificationUrl,
      auto_return: 'approved',
    }

    const res = await fetch(`${this.baseUrl}/checkout/preferences`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const texto = await res.text()
      throw new Error(`No se pudo crear preferencia de MercadoPago: ${res.status} ${texto}`)
    }

    const data = (await res.json()) as {
      id: string
      init_point: string
      sandbox_init_point?: string
    }
    return {
      preferenceId: data.id,
      initPoint: data.init_point,
      sandboxInitPoint: data.sandbox_init_point,
    }
  }

  async obtenerPago(paymentId: string): Promise<DatosPagoPasarela> {
    const res = await fetch(`${this.baseUrl}/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
      },
    })

    if (!res.ok) {
      const texto = await res.text()
      throw new Error(`No se pudo obtener pago de MercadoPago: ${res.status} ${texto}`)
    }

    const data = (await res.json()) as any
    return {
      paymentId: String(data.id),
      status: data.status,
      statusDetail: data.status_detail,
      externalReference: data.external_reference,
      transactionAmountCentavos:
        typeof data.transaction_amount === 'number' ? Math.round(data.transaction_amount * 100) : undefined,
      currencyId: data.currency_id,
      payerEmail: data.payer?.email,
      dateApproved: data.date_approved ? new Date(data.date_approved) : undefined,
      dateCreated: data.date_created ? new Date(data.date_created) : undefined,
      dateLastUpdated: data.date_last_updated ? new Date(data.date_last_updated) : undefined,
    }
  }
}