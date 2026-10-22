import type { SupabaseClient } from '@supabase/supabase-js'
import { Postulacion } from '@tfi/domain'
import type { EstadoPostulacion, MotivoRevision } from '@tfi/domain'
import type { RepositorioDePostulaciones } from '@tfi/application'

interface FilaPostulacion {
  id: string
  aspirante_id: string
  estado: EstadoPostulacion
  creado_el: Date
  actualizado_el: Date
  periodo_id: string
  numero: number | null
  vence_el: Date
  motivo_revision: MotivoRevision | null
}

function mapearPostulacion(fila: FilaPostulacion): Postulacion {
  return new Postulacion(
    fila.id,
    fila.aspirante_id,
    fila.estado,
    new Date(fila.creado_el),
    new Date(fila.actualizado_el),
    fila.periodo_id,
    fila.numero,
    new Date(fila.vence_el),
    fila.motivo_revision,
  )
}

export class RepositorioDePostulacionesSupabase implements RepositorioDePostulaciones {
  constructor(private readonly supabase: SupabaseClient) {}

  async obtenerTodos(): Promise<Postulacion[]> {
    const { data, error } = await this.supabase
      .from('postulaciones')
      .select('*')
    if (error || !data) return []
    return (data as FilaPostulacion[]).map(mapearPostulacion)
  }

  async obtenerPorId(id: string): Promise<Postulacion | null> {
    const { data, error } = await this.supabase
      .from('postulaciones')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error || !data) return null
    return mapearPostulacion(data as FilaPostulacion)
  }

  async obtenerPorEstado(estado: EstadoPostulacion): Promise<Postulacion[]> {
    const { data, error } = await this.supabase
      .from('postulaciones')
      .select('*')
      .eq('estado', estado)
    if (error || !data) return []
    return (data as FilaPostulacion[]).map(mapearPostulacion)
  }

  async obtenerPorNumero(numero: number): Promise<Postulacion | null> {
    const { data, error } = await this.supabase
      .from('postulaciones')
      .select('*')
      .eq('numero', numero)
      .maybeSingle()
    if (error || !data) return null

    return mapearPostulacion(data as FilaPostulacion)
  }

  // async obtenerPorD(dni: Dni, periodoId: string): Promise<Postulacion[]>{}

  // async obtenerPorAspirante(aspiranteId: string): Promise<Postulacion[]>{}

  // async crear(aspiranteId: string, periodoId: string): Promise<Postulacion>{}

  // async guardarTransicion(antes: Postulacion, despues: Postulacion): Promise<'ok' | 'conflicto'>
}
