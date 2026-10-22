import type { SupabaseClient } from '@supabase/supabase-js'
import { Postulacion } from '@tfi/domain'
import type { EstadoPostulacion, MotivoRevision } from '@tfi/domain'
import type { RepositorioDePostulaciones } from '@tfi/application'

interface FilaPostulacion {
  id: string
  aspiranteId: string
  estado: EstadoPostulacion
  creadoEl: Date
  actualizadoEl: Date
  periodoId: string
  numero: number | null
  venceEl: Date
  motivo_revision: MotivoRevision | null
}

function mapearPostulacion(fila: FilaPostulacion): Postulacion {
  return new Postulacion(
    fila.id,
    fila.aspiranteId,
    fila.estado,
    new Date(fila.creadoEl),
    new Date(fila.actualizadoEl),
    fila.periodoId,
    fila.numero,
    new Date(fila.venceEl),
    fila.motivo_revision,
  )
}

export class RepositorioDePostulacionSupabase implements RepositorioDePostulaciones {
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

  async obtenerPorEstado(
    estado: EstadoPostulacion,
  ): Promise<Postulacion[] | null> {
    const { data, error } = await this.supabase
      .from('postulaciones')
      .select('*')
      .eq('estado', estado)
    if (error || !data) return null
    return (data as FilaPostulacion[]).map(mapearPostulacion)
  }

  async guardar(postulacion: Postulacion): Promise<void> {
    console.log('No se que hacer jeje', postulacion)
    // aca no se si tendria que ir a un trigger que cree la postulacion en el momento que esta persona inicia el tramite o si tengo que crearlo desde aca
  }
}
