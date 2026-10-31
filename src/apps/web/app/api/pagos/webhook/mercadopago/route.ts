import { NextResponse } from 'next/server'
import { z } from 'zod'
import { crearClienteServiceRole } from '@/lib/supabase/service-role'
import {
  MercadoPagoAdapter,
  RepositorioDePostulacionesSupabase,
  AccionesDelPersonalSupabase,
  RelojDeSistema,
  RepositorioDeIntencionesDePagoSupabase,
} from '@tfi/infrastructure'
import { ProcesarWebhookMercadoPagoUseCase } from '@tfi/application'
import type { AccionesDelPersonal } from '@tfi/application'

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

    const paymentId = id ? String(id) : undefined
    const webhookEventId =
      request.headers.get('x-request-id') ?? (body?.id ? String(body.id) : undefined)

    if (!paymentId) {
      return NextResponse.json({ ok: true })
    }

    const habilitarPasarela = process.env.PAGOS_PASARELA === 'mercadopago'
    if (!habilitarPasarela || !process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json({ ok: true })
    }

    const supabase = crearClienteServiceRole()
    const repoPostulaciones = new RepositorioDePostulacionesSupabase(
      supabase as unknown as ConstructorParameters<typeof RepositorioDePostulacionesSupabase>[0],
    )
    const accionesDelPersonalBase = new AccionesDelPersonalSupabase(
      supabase as unknown as ConstructorParameters<typeof AccionesDelPersonalSupabase>[0],
      repoPostulaciones,
    )
    // El webhook llega sin sesión: usa la RPC que valida con la clave de
    // servicio (`confirmar_vacante_por_webhook`), no la acción manual.
    const accionesDelPersonal: AccionesDelPersonal = {
      confirmarVacante: (postulacionId) =>
        accionesDelPersonalBase.acreditarPagoPorWebhook(postulacionId),
      prorrogarPlazo: (postulacionId, venceEl) =>
        accionesDelPersonalBase.prorrogarPlazo(postulacionId, venceEl),
    }
    const reloj = new RelojDeSistema()
    const pasarela = new MercadoPagoAdapter({ accessToken: process.env.MP_ACCESS_TOKEN })
    const intenciones = new RepositorioDeIntencionesDePagoSupabase(
      supabase as unknown as ConstructorParameters<typeof RepositorioDeIntencionesDePagoSupabase>[0],
    )

    const useCase = new ProcesarWebhookMercadoPagoUseCase(
      repoPostulaciones,
      pasarela,
      accionesDelPersonal,
      reloj,
      intenciones,
    )

    const resultado = await useCase.ejecutar({
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
