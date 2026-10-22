import type { Documento } from '@tfi/domain'

export interface RepositorioDeDocumentos {
  obtenerTodos(): Promise<Documento[]>
  obtenerPorId(id: string): Promise<Documento | null>
  obtenerPorPostulacion(postulacionId: string): Promise<Documento[]>
  guardar(documento: Documento): Promise<void>
}
