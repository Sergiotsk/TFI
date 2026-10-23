import type { Documento } from '@tfi/domain'
import type { Pagina, Paginacion } from '../../paginacion'
import type { EstadoDocumento, TipoDeDocumento } from '@tfi/domain'

/** Filtros del listado de documentos. */
export interface FiltrosDeDocumento {
  postulacionId?: string
  estado?: EstadoDocumento
  tipo?: TipoDeDocumento
}

/**
 * Puerta de acceso a los documentos de una Postulación.
 *
 * - `listar` pagina en la base para el personal.
 * - `obtenerPorPostulacion` devuelve todos los documentos de una Postulación
 *   (se usa para decidir el estado de la documentación).
 * - `guardar` inserta o actualiza; `eliminar` borra la fila. El archivo vive en
 *   Supabase Storage y lo maneja `AlmacenDeArchivos`.
 */
export interface RepositorioDeDocumentos {
  listar(
    filtros: FiltrosDeDocumento,
    paginacion: Paginacion,
  ): Promise<Pagina<Documento>>
  obtenerPorId(id: string): Promise<Documento | null>
  obtenerPorPostulacion(postulacionId: string): Promise<Documento[]>
  guardar(documento: Documento): Promise<void>
  eliminar(id: string): Promise<void>
}
