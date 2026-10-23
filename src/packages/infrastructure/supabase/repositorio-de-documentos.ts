import type { SupabaseClient } from '@supabase/supabase-js'
import { armarPagina, rangoDe } from '@tfi/application'
import type {
  FiltrosDeDocumento,
  Pagina,
  Paginacion,
  RepositorioDeDocumentos,
} from '@tfi/application'
import type { Documento } from '@tfi/domain'
import { mapearDocumento } from './mapeadores/documento'

/**
 * Adaptador de `RepositorioDeDocumentos` sobre Supabase.
 *
 * RLS decide qué filas ve cada rol: el aspirante solo las de sus Postulaciones
 * y Secretaría/Dirección las de su institución. El adaptador no repite esa
 * regla; el caso de uso es la primera barrera.
 */
export class RepositorioDeDocumentosSupabase implements RepositorioDeDocumentos {
  constructor(private readonly supabase: SupabaseClient) {}

  async listar(
    filtros: FiltrosDeDocumento,
    paginacion: Paginacion,
  ): Promise<Pagina<Documento>> {
    let consulta = this.supabase.from('documentos').select('*', { count: 'exact' })

    if (filtros.postulacionId !== undefined) {
      consulta = consulta.eq('postulacion_id', filtros.postulacionId)
    }
    if (filtros.estado !== undefined) consulta = consulta.eq('estado', filtros.estado)
    if (filtros.tipo !== undefined) consulta = consulta.eq('tipo', filtros.tipo)

    const { desde, hasta } = rangoDe(paginacion)
    const { data, error, count } = await consulta
      .order('creado_el', { ascending: false })
      .range(desde, hasta)

    if (error || !data) return armarPagina([], 0, paginacion)

    return armarPagina(data.map(mapearDocumento), count ?? 0, paginacion)
  }

  async obtenerPorId(id: string): Promise<Documento | null> {
    const { data, error } = await this.supabase
      .from('documentos')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error || !data) return null

    return mapearDocumento(data)
  }

  async obtenerPorPostulacion(postulacionId: string): Promise<Documento[]> {
    const { data, error } = await this.supabase
      .from('documentos')
      .select('*')
      .eq('postulacion_id', postulacionId)
      .order('creado_el', { ascending: true })
    if (error || !data) return []

    return data.map(mapearDocumento)
  }

  /**
   * Sin `upsert`: PostgREST lo arma como `ON CONFLICT DO UPDATE SET id = ...` y
   * `authenticated` no tiene UPDATE sobre `id` (los grants son por columna).
   * Primero actualiza sin tocar el id; si no hubo fila (documento nuevo, o RLS
   * no deja actualizarlo), lo da de alta.
   */
  async guardar(documento: Documento): Promise<void> {
    const columnas = {
      postulacion_id: documento.postulacionId,
      tipo: documento.tipo,
      ruta: documento.ruta,
      nombre_archivo: documento.nombreArchivo,
      mime_type: documento.mimeType,
      tamanio_bytes: documento.tamanioBytes,
      vigencia: documento.vigencia,
      estado: documento.estado,
      subido_por: documento.subidoPor,
      revisado_por: documento.revisadoPor,
      revisado_el: documento.revisadoEl?.toISOString() ?? null,
      observaciones: documento.observaciones,
    }

    const actualizacion = await this.supabase
      .from('documentos')
      .update(columnas)
      .eq('id', documento.id)
      .select('id')
    if (actualizacion.error) {
      throw new Error(`No se pudo guardar el documento: ${actualizacion.error.message}`)
    }
    if (actualizacion.data.length > 0) return

    const { error } = await this.supabase
      .from('documentos')
      .insert({ id: documento.id, ...columnas })
    if (error) throw new Error(`No se pudo guardar el documento: ${error.message}`)
  }

  async eliminar(id: string): Promise<void> {
    const { error } = await this.supabase.from('documentos').delete().eq('id', id)
    if (error) throw new Error(`No se pudo eliminar el documento: ${error.message}`)
  }
}
