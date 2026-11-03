import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Verifica la firma `x-signature` de MercadoPago.
 *
 * MP firma `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` con HMAC-SHA256
 * usando el secreto del webhook. La firma es opcional en la demo: si
 * `MP_WEBHOOK_SECRET` no está configurado, el route igual valida el pago contra
 * `GET /v1/payments/:id`. Con el secreto configurado, una firma inválida se
 * rechaza antes de consultar la API.
 */
export function firmaDeMercadoPagoValida(params: {
  secret: string
  signature: string | null
  requestId: string | null
  dataId: string
}): boolean {
  if (!params.signature || !params.requestId || !params.dataId) return false

  const partes = params.signature.split(',').map((parte) => parte.trim())
  const ts = partes.find((parte) => parte.startsWith('ts='))?.slice(3)
  const v1 = partes.find((parte) => parte.startsWith('v1='))?.slice(3)
  if (!ts || !v1) return false

  const manifiesto = `id:${params.dataId};request-id:${params.requestId};ts:${ts};`
  const esperado = createHmac('sha256', params.secret).update(manifiesto).digest('hex')
  const recibido = Buffer.from(v1, 'utf8')
  const calculado = Buffer.from(esperado, 'utf8')

  return recibido.length === calculado.length && timingSafeEqual(recibido, calculado)
}
