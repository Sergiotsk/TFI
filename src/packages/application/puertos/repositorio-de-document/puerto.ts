import type { Document } from '@tfi/domain'

export interface RepositorioDeDocument {
  obtenerTodos(): Promise<Document[]>
  obtenerPorId(id: string): Promise<Document | null>
  obtenerPorProcedure(procedureId: string): Promise<Document[] | null>
  guardar(document: Document): Promise<void>
}
