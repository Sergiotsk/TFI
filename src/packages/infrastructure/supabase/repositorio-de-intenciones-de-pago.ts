import type { SupabaseClient } from '@supabase/supabase-js'
import type { CrearIntencionDePago, IntencionDePago, RepositorioDeIntencionesDePago } from '@tfi/application'

function mapear(row: Record<string, unknown>): IntencionDePago {
  return {
    id: row.id as string,
    postulacionId: row.postulacion_id as string,
    periodoId: row.periodo_id as string,
    institucionId: row.institucion_id as string,
    montoCentavos: Number(row.monto_centavos),
    externalId: row.external_id as string,
    preferenceId: (row.preference_id as string | null) ?? null,
    initPoint: (row.init_point as string | null) ?? null,
    sandboxInitPoint: (row.sandbox_init_point as string | null) ?? null,
    estado: row.estado as IntencionDePago['estado'],
    paymentIdMp: (row.payment_id_mp as string | null) ?? null,
    webhookEventId: (row.webhook_event_id as string | null) ?? null,
    pagadoEl: row.pagado_el ? new Date(row.pagado_el as string) : null,
    creadoEl: new Date(row.creado_el as string),
    actualizadoEl: new Date(row.actualizado_el as string),
    expiraEl: row.expira_el ? new Date(row.expira_el as string) : null,
  }
}

export class RepositorioDeIntencionesDePagoSupabase implements RepositorioDeIntencionesDePago {
  constructor(private readonly supabase: SupabaseClient) {}

  async crear(intencion: CrearIntencionDePago): Promise<IntencionDePago> {
    const { data, error } = await this.supabase
      .from('intenciones_de_pago')
      .insert({
        postulacion_id: intencion.postulacionId,
        periodo_id: intencion.periodoId,
        institucion_id: intencion.institucionId,
        monto_centavos: intencion.montoCentavos,
        external_id: intencion.externalId,
        preference_id: intencion.preferenceId ?? null,
        init_point: intencion.initPoint ?? null,
        sandbox_init_point: intencion.sandboxInitPoint ?? null,
        expira_el: intencion.expiraEl ? intencion.expiraEl.toISOString() : null,
      })
      .select('*')
      .single()
    if (error || !data) throw new Error(`No se pudo crear la intención de pago: ${error?.message}`)
    return mapear(data)
  }

  async obtenerPorExternalId(externalId: string): Promise<IntencionDePago | null> {
    const { data, error } = await this.supabase
      .from('intenciones_de_pago')
      .select('*')
      .eq('external_id', externalId)
      .maybeSingle()
    if (error || !data) return null
    return mapear(data)
  }

  async obtenerPorPaymentIdMp(paymentIdMp: string): Promise<IntencionDePago | null> {
    const { data, error } = await this.supabase
      .from('intenciones_de_pago')
      .select('*')
      .eq('payment_id_mp', paymentIdMp)
      .maybeSingle()
    if (error || !data) return null
    return mapear(data)
  }

  async marcarProcesada(params: {
    externalId?: string
    paymentIdMp?: string
    webhookEventId?: string
    pagadoEl?: Date
  }): Promise<IntencionDePago | null> {
    let q = this.supabase.from('intenciones_de_pago').update({
      estado: 'PROCESANDO',
      payment_id_mp: params.paymentIdMp ?? undefined,
      webhook_event_id: params.webhookEventId ?? undefined,
      pagado_el: params.pagadoEl ? params.pagadoEl.toISOString() : undefined,
    })
    if (params.externalId) q = q.eq('external_id', params.externalId)
    else if (params.paymentIdMp) q = q.eq('payment_id_mp', params.paymentIdMp)
    else return null
    const { data } = await q.select('*').maybeSingle()
    return data ? mapear(data) : null
  }

  async marcarCompletada(params: {
    externalId?: string
    paymentIdMp: string
    webhookEventId?: string
    pagadoEl?: Date
  }): Promise<IntencionDePago | null> {
    let q = this.supabase.from('intenciones_de_pago').update({
      estado: 'COMPLETADA',
      payment_id_mp: params.paymentIdMp,
      webhook_event_id: params.webhookEventId ?? undefined,
      pagado_el: params.pagadoEl ? params.pagadoEl.toISOString() : new Date().toISOString(),
    })
    if (params.externalId) q = q.eq('external_id', params.externalId)
    else q = q.eq('payment_id_mp', params.paymentIdMp)
    const { data } = await q.select('*').maybeSingle()
    return data ? mapear(data) : null
  }
}