import type { SupabaseClient } from '@supabase/supabase-js'
import { ESTADOS_QUE_OCUPAN_CUPO, PeriodoDuplicado } from '@tfi/domain'
import type { PeriodoDeIngreso } from '@tfi/domain'
import { armarPagina, rangoDe } from '@tfi/application'
import type { Pagina, Paginacion, RepositorioDePeriodos } from '@tfi/application'
import { mapearPeriodo } from './mapeadores/periodo'

/**
 * Adaptador de `RepositorioDePeriodos` sobre Supabase.
 *
 * La ocupación no es una columna: se cuenta en `postulaciones`. `contarOcupados`
 * usa `ESTADOS_QUE_OCUPAN_CUPO` (VACANTE_CONFIRMADA y posteriores) y
 * `contarPendientesVigentes` excluye las que ya vencieron, igual que
 * `Postulacion.estadoEn(ahora)`.
 */
export class RepositorioDePeriodosSupabase implements RepositorioDePeriodos {
  constructor(private readonly supabase: SupabaseClient) {}

  async obtenerPorId(id: string): Promise<PeriodoDeIngreso | null> {
    const { data, error } = await this.supabase
      .from('periodos_de_ingreso')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error || !data) return null

    return mapearPeriodo(data)
  }

  async listarAbiertos(institucionId: string, ahora: Date): Promise<PeriodoDeIngreso[]> {
    const { data, error } = await this.supabase
      .from('periodos_de_ingreso')
      .select('*')
      .eq('institucion_id', institucionId)
      .gte('cierra_el', ahora.toISOString())
      .order('cierra_el', { ascending: true })
    if (error || !data) return []

    return data.map(mapearPeriodo)
  }

  async listarTodos(
    institucionId: string,
    paginacion: Paginacion,
  ): Promise<Pagina<PeriodoDeIngreso>> {
    const { desde, hasta } = rangoDe(paginacion)
    const { data, error, count } = await this.supabase
      .from('periodos_de_ingreso')
      .select('*', { count: 'exact' })
      .eq('institucion_id', institucionId)
      .order('cierra_el', { ascending: false })
      .range(desde, hasta)

    if (error || !data) return armarPagina([], 0, paginacion)

    return armarPagina(data.map(mapearPeriodo), count ?? 0, paginacion)
  }

  async contarOcupados(periodoId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('postulaciones')
      .select('id', { count: 'exact', head: true })
      .eq('periodo_id', periodoId)
      .in('estado', [...ESTADOS_QUE_OCUPAN_CUPO])
    if (error) throw new Error(`No se pudo contar la ocupación: ${error.message}`)

    return count ?? 0
  }

  async contarPendientesVigentes(periodoId: string, ahora: Date): Promise<number> {
    const { count, error } = await this.supabase
      .from('postulaciones')
      .select('id', { count: 'exact', head: true })
      .eq('periodo_id', periodoId)
      .eq('estado', 'PAGO_PENDIENTE')
      .gt('vence_el', ahora.toISOString())
    if (error) throw new Error(`No se pudieron contar los pagos vigentes: ${error.message}`)

    return count ?? 0
  }

  async guardar(periodo: PeriodoDeIngreso): Promise<void> {
    const { error } = await this.supabase.from('periodos_de_ingreso').upsert({
      id: periodo.id,
      institucion_id: periodo.institucionId,
      nombre: periodo.nombre,
      total_cupos: periodo.totalCupos,
      cierra_el: periodo.cierraEl.toISOString(),
      dias_plazo_pago: periodo.diasPlazoPago,
      monto_matricula_centavos: periodo.montoMatriculaCentavos,
    })
    if (error?.code === '23505') throw new PeriodoDuplicado(periodo.nombre)
    if (error) throw new Error(`No se pudo guardar el período: ${error.message}`)
  }
}
