import { z } from 'zod'
import type {
  DatosPagoPasarela,
  EstadoPagoPasarela,
  PasarelaDePago,
  PreferenciaCreada,
  PreferenciaPago,
} from '@tfi/application'

const TIEMPO_MAXIMO_DE_ESPERA_MS = 10_000

const ESTADOS_DE_PAGO_MP = [
  'approved',
  'authorized',
  'pending',
  'in_process',
  'in_mediation',
  'rejected',
  'cancelled',
  'refunded',
  'charged_back',
] as const satisfies readonly EstadoPagoPasarela[]

const esquemaPreferencia = z.object({
  id: z.string(),
  init_point: z.string(),
  sandbox_init_point: z.string().optional(),
})

const esquemaPago = z
  .object({
    id: z.union([z.string(), z.number()]),
    status: z.string(),
    status_detail: z.string().nullable().optional(),
    external_reference: z.string().nullable().optional(),
    transaction_amount: z.coerce.number().positive().nullable().optional(),
    currency_id: z.string().nullable().optional(),
    payer: z
      .object({ email: z.string().nullable().optional() })
      .passthrough()
      .nullable()
      .optional(),
    date_approved: z.string().nullable().optional(),
    date_created: z.string().nullable().optional(),
    date_last_updated: z.string().nullable().optional(),
  })
  .passthrough()

export interface ConfiguracionMercadoPago {
  accessToken: string
  baseUrl?: string
  integratorId?: string
  platformId?: string
}

function fecha(valor: string | null | undefined): Date | undefined {
  if (!valor) return undefined
  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime()) ? undefined : fecha
}

function estadoValido(estado: string): EstadoPagoPasarela {
  return (ESTADOS_DE_PAGO_MP as readonly string[]).includes(estado)
    ? (estado as EstadoPagoPasarela)
    : 'pending'
}

export class MercadoPagoAdapter implements PasarelaDePago {
  private readonly baseUrl: string

  constructor(private readonly config: ConfiguracionMercadoPago) {
    this.baseUrl = config.baseUrl ?? 'https://api.mercadopago.com'
  }

  async crearPreferencia(preferencia: PreferenciaPago): Promise<PreferenciaCreada> {
    const body: Record<string, unknown> = {
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

    if (preferencia.expiresAt) {
      body.expires = true
      body.expiration_date_to = preferencia.expiresAt.toISOString()
    }

    const res = await fetch(`${this.baseUrl}/checkout/preferences`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIEMPO_MAXIMO_DE_ESPERA_MS),
    })

    if (!res.ok) {
      const texto = await res.text()
      throw new Error(`No se pudo crear preferencia de MercadoPago: ${res.status} ${texto}`)
    }

    const data = esquemaPreferencia.parse(await res.json())
    return {
      preferenceId: data.id,
      initPoint: data.init_point,
      sandboxInitPoint: data.sandbox_init_point,
    }
  }

  async obtenerPago(paymentId: string): Promise<DatosPagoPasarela> {
    const res = await fetch(
      `${this.baseUrl}/v1/payments/${encodeURIComponent(paymentId)}`,
      {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
        },
        signal: AbortSignal.timeout(TIEMPO_MAXIMO_DE_ESPERA_MS),
      },
    )

    if (!res.ok) {
      const texto = await res.text()
      throw new Error(`No se pudo obtener pago de MercadoPago: ${res.status} ${texto}`)
    }

    const data = esquemaPago.parse(await res.json())
    return {
      paymentId: String(data.id),
      status: estadoValido(data.status),
      statusDetail: data.status_detail ?? undefined,
      externalReference: data.external_reference ?? undefined,
      transactionAmountCentavos:
        data.transaction_amount === null || data.transaction_amount === undefined
          ? undefined
          : Math.round(data.transaction_amount * 100),
      currencyId: data.currency_id ?? undefined,
      payerEmail: data.payer?.email ?? undefined,
      dateApproved: fecha(data.date_approved),
      dateCreated: fecha(data.date_created),
      dateLastUpdated: fecha(data.date_last_updated),
    }
  }
}
