import { Monto } from '@tfi/domain'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MercadoPagoAdapter } from './mercadopago-adapter'

const BASE = 'https://api.mercadopago.test'

function respuestaJson(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('MercadoPagoAdapter', () => {
  it('crea la preferencia con vencimiento y devuelve los puntos de pago', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      respuestaJson({
        id: 'pref_1',
        init_point: 'https://mp.test/init',
        sandbox_init_point: 'https://sandbox.mp.test/init',
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const adapter = new MercadoPagoAdapter({ accessToken: 'token', baseUrl: BASE })
    const creada = await adapter.crearPreferencia({
      externalId: 'int_1',
      postulacionId: 'post_1',
      titulo: 'Matrícula',
      monto: new Monto(1_500_000),
      backUrls: {
        success: 'https://app.test/pagos/retorno?resultado=success',
        pending: 'https://app.test/pagos/retorno?resultado=pending',
        failure: 'https://app.test/pagos/retorno?resultado=failure',
      },
      notificationUrl: 'https://app.test/api/pagos/webhook/mercadopago',
      expiresAt: new Date('2026-12-01T00:00:00.000Z'),
    })

    expect(creada).toEqual({
      preferenceId: 'pref_1',
      initPoint: 'https://mp.test/init',
      sandboxInitPoint: 'https://sandbox.mp.test/init',
    })
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${BASE}/checkout/preferences`)
    expect(init.method).toBe('POST')
    const body = JSON.parse(String(init.body)) as Record<string, unknown>
    expect(body.external_reference).toBe('int_1')
    expect(body.expires).toBe(true)
    expect(body.expiration_date_to).toBe('2026-12-01T00:00:00.000Z')
    expect(body.items).toEqual([
      expect.objectContaining({ unit_price: 15000, currency_id: 'ARS' }),
    ])
  })

  it('consulta el pago con el id codificado y mapea los datos', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      respuestaJson({
        id: 123,
        status: 'approved',
        status_detail: 'accredited',
        external_reference: 'int_1',
        transaction_amount: 15000.5,
        currency_id: 'ARS',
        payer: { email: 'alguien@example.com' },
        date_approved: '2026-10-20T12:00:00.000Z',
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const adapter = new MercadoPagoAdapter({ accessToken: 'token', baseUrl: BASE })
    const pago = await adapter.obtenerPago('123/abc')

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/v1/payments/123%2Fabc`,
      expect.objectContaining({
        headers: { Authorization: 'Bearer token' },
      }),
    )
    expect(pago).toMatchObject({
      paymentId: '123',
      status: 'approved',
      externalReference: 'int_1',
      transactionAmountCentavos: 1_500_050,
      currencyId: 'ARS',
      payerEmail: 'alguien@example.com',
    })
    expect(pago.dateApproved?.toISOString()).toBe('2026-10-20T12:00:00.000Z')
  })

  it('mapea un estado desconocido a pending en vez de romper el tipo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(respuestaJson({ id: '1', status: 'estado_nuevo' })),
    )

    const adapter = new MercadoPagoAdapter({ accessToken: 'token', baseUrl: BASE })
    const pago = await adapter.obtenerPago('1')

    expect(pago.status).toBe('pending')
    expect(pago.transactionAmountCentavos).toBeUndefined()
  })

  it('propaga el error de la API con el status y el texto', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('no autorizado', { status: 401 })),
    )

    const adapter = new MercadoPagoAdapter({ accessToken: 'token', baseUrl: BASE })

    await expect(adapter.obtenerPago('1')).rejects.toThrow(
      'No se pudo obtener pago de MercadoPago: 401 no autorizado',
    )
  })

  it('falla si la respuesta no tiene la forma esperada', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuestaJson({ id: '1' })))

    const adapter = new MercadoPagoAdapter({ accessToken: 'token', baseUrl: BASE })

    await expect(adapter.obtenerPago('1')).rejects.toThrow()
  })
})
