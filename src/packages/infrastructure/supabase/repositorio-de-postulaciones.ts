import type { SupabaseClient } from '@supabase/supabase-js'
import { NumeroDePostulacion, Postulacion, PostulacionDuplicada } from '@tfi/domain'
import type { EstadoPostulacion, MotivoRevision } from '@tfi/domain'
import type { FiltrosDePostulacion, RepositorioDePostulaciones } from '@tfi/application'

// Lo que devuelve PostgREST: snake_case y fechas ISO. `vence_el` es NULL en
// toda Postulación que todavía no inició el pago.
interface FilaPostulacion {
  id: string
  aspirante_id: string
  estado: EstadoPostulacion
  creado_el: string
  actualizado_el: string
  periodo_id: string
  numero: number
  vence_el: string | null
  motivo_revision: MotivoRevision | null
}

function mapearPostulacion(fila: FilaPostulacion): Postulacion {
  return new Postulacion(
    fila.id,
    NumeroDePostulacion.desde(fila.numero),
    fila.aspirante_id,
    fila.periodo_id,
    fila.estado,
    fila.vence_el === null ? null : new Date(fila.vence_el),
    fila.motivo_revision,
    new Date(fila.creado_el),
    new Date(fila.actualizado_el),
  )
}

/**
 * Adaptador de `RepositorioDePostulaciones` sobre Supabase.
 *
 * Las políticas RLS y los GRANT por columna son la segunda barrera: este
 * adaptador no puede escribir `numero` ni `motivo_revision`, y solo puede mover
 * el estado por las transiciones que el trigger guardián permite.
 */
export class RepositorioDePostulacionesSupabase implements RepositorioDePostulaciones {
  constructor(private readonly supabase: SupabaseClient) {}

  async obtenerPorId(id: string): Promise<Postulacion | null> {
    const { data, error } = await this.supabase
      .from('postulaciones')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error || !data) return null

    return mapearPostulacion(data as FilaPostulacion)
  }

  async obtenerPorNumero(numero: NumeroDePostulacion): Promise<Postulacion | null> {
    const { data, error } = await this.supabase
      .from('postulaciones')
      .select('*')
      .eq('numero', numero.valor)
      .maybeSingle()
    if (error || !data) return null

    return mapearPostulacion(data as FilaPostulacion)
  }

  async listar(filtros: FiltrosDePostulacion): Promise<Postulacion[]> {
    let consulta = this.supabase.from('postulaciones').select('*')

    if (filtros.aspiranteId !== undefined) {
      consulta = consulta.eq('aspirante_id', filtros.aspiranteId)
    }
    if (filtros.periodoId !== undefined) {
      consulta = consulta.eq('periodo_id', filtros.periodoId)
    }
    if (filtros.estado !== undefined) {
      consulta = consulta.eq('estado', filtros.estado)
    }
    if (filtros.motivoRevision !== undefined) {
      consulta = consulta.eq('motivo_revision', filtros.motivoRevision)
    }

    const { data, error } = await consulta.order('numero', { ascending: true })
    if (error || !data) return []

    return (data as FilaPostulacion[]).map(mapearPostulacion)
  }

  async buscarPorDni(dni: string, periodoId?: string): Promise<Postulacion[]> {
    // El DNI no vive en la Postulación sino en el perfil del aspirante.
    const { data, error } = await this.supabase
      .from('perfiles')
      .select('id')
      .eq('dni', dni)
      .maybeSingle()
    if (error || !data) return []

    return this.listar({ aspiranteId: data.id as string, periodoId })
  }

  async crear(aspiranteId: string, periodoId: string): Promise<Postulacion> {
    // Solo se insertan las columnas con GRANT: `numero` lo genera la identidad y
    // `estado` toma su default (PREINSCRIPTO).
    const { data, error } = await this.supabase
      .from('postulaciones')
      .insert({ aspirante_id: aspiranteId, periodo_id: periodoId })
      .select('*')
      .single()

    if (error) {
      if (error.code === '23505') throw new PostulacionDuplicada(aspiranteId, periodoId)
      throw new Error(`No se pudo crear la Postulación: ${error.message}`)
    }

    return mapearPostulacion(data as FilaPostulacion)
  }

  async guardarTransicion(
    antes: Postulacion,
    despues: Postulacion,
  ): Promise<'ok' | 'conflicto'> {
    const { data, error } = await this.supabase
      .from('postulaciones')
      .update({
        estado: despues.estado,
        vence_el: despues.venceEl === null ? null : despues.venceEl.toISOString(),
      })
      // Concurrencia optimista: solo escribe si nadie movió la fila mientras tanto.
      .eq('id', antes.id)
      .eq('estado', antes.estado)
      .select('id')

    if (error) throw new Error(`No se pudo guardar la transición: ${error.message}`)

    return Array.isArray(data) && data.length > 0 ? 'ok' : 'conflicto'
  }
}
