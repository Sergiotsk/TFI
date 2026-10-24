import { NextResponse } from 'next/server'
import { crearClienteServiceRole } from '@/lib/supabase/service-role'
import {
  MercadoPagoAdapter,
  RepositorioDePostulacionesSupabase,
  RepositorioDePeriodosSupabase,
  AccionesDelPersonalSupabase,
  RelojDeSistema,
  RepositorioDeIntencionesDePagoSupabase,
} from '@tfi/infrastructure'
import { ProcesarWebhookMercadoPagoUseCase } from '@tfi/application'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const search = new URL(request.url).searchParams

    const topic = body?.type ?? body?.topic ?? search.get('topic') ?? undefined
    const action = body?.action ?? search.get('action') ?? undefined
    const id =
      body?.data?.id ??
      body?.id ??
      search.get('id') ??
      search.get('data.id') ??
      undefined

    const paymentId = id ? String(id) : undefined
    const webhookEventId = request.headers.get('x-request-id') ?? (body?.id ? String(body.id) : undefined)

    if (!paymentId) {
      return NextResponse.json({ ok: true })
    }

    const habilitarPasarela = process.env.PAGOS_PASARELA === 'mercadopago'
    if (!habilitarPasarela || !process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json({ ok: true })
    }

    const supabase = crearClienteServiceRole()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const repoPostulaciones = new RepositorioDePostulacionesSupabase(supabase as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const repoPeriodos = new RepositorioDePeriodosSupabase(supabase as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accionesDelPersonal: any = new AccionesDelPersonalSupabase(supabase as any, repoPostulaciones)
    if (typeof (accionesDelPersonal as { acreditarPagoPorWebhook?: unknown }).acreditarPagoPorWebhook === 'function') {
      ;(accionesDelPersonal as { confirmarVacante: unknown }).confirmarVacante = (
        accionesDelPersonal as { acreditarPagoPorWebhook: (...args: unknown[]) => unknown }
      ).acreditarPagoPorWebhook.bind(accionesDelPersonal)
    }
    const reloj = new RelojDeSistema()
    const pasarela = new MercadoPagoAdapter({ accessToken: process.env.MP_ACCESS_TOKEN })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const intenciones = new RepositorioDeIntencionesDePagoSupabase(supabase as any)

    const useCase = new ProcesarWebhookMercadoPagoUseCase(
      repoPostulaciones,
      repoPeriodos,
      pasarela,
      accionesDelPersonal,
      reloj,
      intenciones,
    )

    await useCase.ejecutar({
      paymentId,
      webhookEventId: webhookEventId ?? undefined,
      topic: topic ?? action,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}