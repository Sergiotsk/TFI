import { Document } from '@tfi/domain'
import type { RepositorioDeDocument } from './puerto'

export class RepositorioDeDocumentFake implements RepositorioDeDocument {
  private documents: Document[] = [
    new Document(
      'doc-1',
      '1',
      '/uploads/procedures/1/dni_frente_dorso.pdf',
      365,
    ),
    new Document(
      'doc-2',
      '1',
      '/uploads/procedures/1/constancia_cuil.pdf',
      180,
    ),
    new Document(
      'doc-3',
      '2',
      '/uploads/procedures/2/declaracion_jurada.pdf',
      90,
    ),
    new Document(
      'doc-4',
      '3',
      '/uploads/procedures/3/certificado_aprobacion.pdf',
      730,
    ),
    new Document(
      'doc-5',
      '4',
      '/uploads/procedures/4/documentacion_rechazada.pdf',
      30,
    ),
    new Document(
      'doc-6',
      '5',
      '/uploads/procedures/5/formulario_solicitud.pdf',
      180,
    ),
  ]

  async obtenerTodos(): Promise<Document[]> {
    return this.documents
  }

  async obtenerPorId(id: string): Promise<Document | null> {
    const document = this.documents.find((d) => d.id === id)
    return document || null
  }

  async obtenerPorProcedure(procedureId: string): Promise<Document[]> {
    return this.documents.filter((d) => d.procedureId === procedureId)
  }

  async guardar(document: Document): Promise<void> {
    const index = this.documents.findIndex((d) => d.id === document.id)
    if (index >= 0) {
      this.documents[index] = document
    } else {
      this.documents.push(document)
    }
  }

  async eliminar(id: string): Promise<void> {
    this.documents = this.documents.filter((d) => d.id !== id)
  }
}
