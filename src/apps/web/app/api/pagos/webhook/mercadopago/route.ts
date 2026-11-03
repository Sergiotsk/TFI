import { NextResponse } from 'next/server'
import { z } from 'zod'
import { crearDependenciasSinSesion } from '@/composition-root'
import { firmaDeMercadoPagoValida } from '@/lib/mercadopago-webhook'

const esquemaNotificacion = z
  .object({
    type: z.string().optional(),
    topic: z.string().optional(),
    action: z.string().optional(),
    id: z.union([z.string(), z.number()]).optional(),
    data: z.object({ id: z.union([z.string(), z.number()]).optional() }).optional(),
  })
  .passthrough()

export async function POST(request: Request) {
  try {
    const cuerpo = esquemaNotificacion.safeParse(await request.json().catch(() => ({})))
    const body = cuerpo.success ? cuerpo.data : {}
    const search = new URL(request.url).searchParams

    const tipo = body?.type ?? body?.topic ?? search.get('type') ?? search.get('topic') ?? undefined
    const accion = body?.action ?? search.get('action') ?? undefined
    const esNotificacionDePago =
      tipo === undefined ||
      tipo === 'payment' ||
      (typeof accion === 'string' && accion.startsWith('payment.'))

    // MercadoPago también manda merchant_order y otros eventos: no son pagos.
    if (!esNotificacionDePago) {
      return NextResponse.json({ ok: true })
    }

    const id =
      body?.data?.id ??
      body?.id ??
      search.get('id') ??
      search.get('data.id') ??
      undefined

    const paymentId = id === undefined ? undefined : String(id)
    const webhookEventId =
      request.headers.get('x-request-id') ?? (body?.id ? String(body.id) : undefined)

    // El id de un pago de MP es numérico. Cualquier otra cosa se ignora sin
    // consultar la API ni tocar la base.
    if (!paymentId || !/^\d{1,20}$/.test(paymentId)) {
      return NextResponse.json({ ok: true })
    }

    const secreto = process.env.MP_WEBHOOK_SECRET
    if (secreto) {
      const firmaValida = firmaDeMercadoPagoValida({
        secret: secreto,
        signature: request.headers.get('x-signature'),
        requestId: request.headers.get('x-request-id'),
        dataId: paymentId,
      })
      if (!firmaValida) {
        console.warn('[webhook mercadopago] firma inválida', { paymentId })
        return NextResponse.json({ ok: false }, { status: 401 })
      }
    } else {
      console.warn(
        '[webhook mercadopago] MP_WEBHOOK_SECRET no configurado; se valida el pago contra la API de MP',
      )
    }

    const deps = crearDependenciasSinSesion()
    if (!deps.procesarWebhookMercadoPago) {
      console.error(
        '[webhook mercadopago] pasarela deshabilitada o configuración incompleta (PAGOS_PASARELA/MP_ACCESS_TOKEN)',
      )
      return NextResponse.json({ ok: false }, { status: 503 })
    }

    const resultado = await deps.procesarWebhookMercadoPago.ejecutar({
      paymentId,
      webhookEventId: webhookEventId ?? undefined,
    })

    console.info('[webhook mercadopago] notificación procesada', {
      paymentId,
      ...resultado,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    // 5xx: MercadoPago reintenta. El detalle queda en los logs del servidor.
    console.error('[webhook mercadopago] error al procesar la notificación', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
