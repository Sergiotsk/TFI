import { Documento } from '@tfi/domain'
import type { RepositorioDeDocumentos } from './puerto'

export class RepositorioDeDocumentosFake implements RepositorioDeDocumentos {
  private documentos: Documento[] = [
    new Documento(
      'doc-1',
      '1',
      '/uploads/postulaciones/1/dni_frente_dorso.pdf',
      365,
      'PENDIENTE',
    ),
    new Documento(
      'doc-2',
      '1',
      '/uploads/postulaciones/1/constancia_cuil.pdf',
      180,
      'APROBADO',
    ),
    new Documento(
      'doc-3',
      '2',
      '/uploads/postulaciones/2/declaracion_jurada.pdf',
      90,
      'PENDIENTE',
    ),
    new Documento(
      'doc-4',
      '3',
      '/uploads/postulaciones/3/certificado_aprobacion.pdf',
      730,
      'OBSERVADO',
    ),
    new Documento(
      'doc-5',
      '4',
      '/uploads/postulaciones/4/documentacion_rechazada.pdf',
      30,
      'OBSERVADO',
    ),
    new Documento(
      'doc-6',
      '5',
      '/uploads/postulaciones/5/formulario_solicitud.pdf',
      180,
      'PENDIENTE',
    ),
  ]

  async obtenerTodos(): Promise<Documento[]> {
    return this.documentos
  }

  async obtenerPorId(id: string): Promise<Documento | null> {
    const documento = this.documentos.find((d) => d.id === id)
    return documento ?? null
  }

  async obtenerPorPostulacion(postulacionId: string): Promise<Documento[]> {
    return this.documentos.filter((d) => d.postulacionId === postulacionId)
  }

  async guardar(documento: Documento): Promise<void> {
    const index = this.documentos.findIndex((d) => d.id === documento.id)
    if (index >= 0) {
      this.documentos[index] = documento
    } else {
      this.documentos.push(documento)
    }
  }

  // Helpers para tests
  reset(): void {
    this.documentos = []
  }
}
