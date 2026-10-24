import type {
  DatosPagoPasarela,
  PasarelaDePago,
  PreferenciaCreada,
  PreferenciaPago,
} from '@tfi/application'

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

    const data = (await res.json()) as Record<string, unknown>
    const payer = data.payer && typeof data.payer === 'object' ? (data.payer as Record<string, unknown>) : undefined
    return {
      paymentId: String(data.id),
      status: (typeof data.status === 'string' ? data.status : 'pending') as DatosPagoPasarela['status'],
      statusDetail: typeof data.status_detail === 'string' ? data.status_detail : undefined,
      externalReference: typeof data.external_reference === 'string' ? data.external_reference : undefined,
      transactionAmountCentavos:
        typeof data.transaction_amount === 'number' ? Math.round(data.transaction_amount * 100) : undefined,
      currencyId: typeof data.currency_id === 'string' ? data.currency_id : undefined,
      payerEmail: typeof payer?.email === 'string' ? payer.email : undefined,
      dateApproved: typeof data.date_approved === 'string' ? new Date(data.date_approved) : undefined,
      dateCreated: typeof data.date_created === 'string' ? new Date(data.date_created) : undefined,
      dateLastUpdated: typeof data.date_last_updated === 'string' ? new Date(data.date_last_updated) : undefined,
    }
  }
}