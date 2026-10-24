import { Documento } from '@tfi/domain'
import type { EstadoDocumento, TipoDeDocumento } from '@tfi/domain'
import { armarPagina, rangoDe } from '../../paginacion'
import type { Pagina, Paginacion } from '../../paginacion'
import type { FiltrosDeDocumento, RepositorioDeDocumentos } from './puerto'

const CREADO = new Date('2026-10-20T00:00:00.000Z')

function documentoDePrueba(
  id: string,
  postulacionId: string,
  tipo: TipoDeDocumento,
  estado: EstadoDocumento,
  observaciones: string | null = null,
): Documento {
  return new Documento(
    id,
    postulacionId,
    tipo,
    `/documentos/${postulacionId}/${id}.pdf`,
    `${tipo.toLowerCase()}.pdf`,
    'application/pdf',
    1024,
    365,
    estado,
    'aspirante-1',
    estado === 'PENDIENTE' ? null : 'secretaria-1',
    estado === 'PENDIENTE' ? null : CREADO,
    observaciones,
    CREADO,
    CREADO,
  )
}

export class RepositorioDeDocumentosFake implements RepositorioDeDocumentos {
  private documentos: Documento[] = [
    documentoDePrueba('doc-1', '1', 'DNI', 'PENDIENTE'),
    documentoDePrueba('doc-2', '1', 'CONSTANCIA_CUIL', 'APROBADO'),
    documentoDePrueba('doc-3', '2', 'PARTIDA_NACIMIENTO', 'PENDIENTE'),
    documentoDePrueba('doc-4', '3', 'TITULO', 'OBSERVADO', 'El título está incompleto'),
    documentoDePrueba('doc-5', '4', 'ANALITICO', 'OBSERVADO', 'Falta la firma'),
    documentoDePrueba('doc-6', '5', 'FOTO', 'PENDIENTE'),
  ]

  async listar(
    filtros: FiltrosDeDocumento,
    paginacion: Paginacion,
  ): Promise<Pagina<Documento>> {
    const filtrados = this.documentos
      .filter(
        (d) => filtros.postulacionId === undefined || d.postulacionId === filtros.postulacionId,
      )
      .filter((d) => filtros.estado === undefined || d.estado === filtros.estado)
      .filter((d) => filtros.tipo === undefined || d.tipo === filtros.tipo)
      .sort((a, b) => b.creadoEl.getTime() - a.creadoEl.getTime())

    const { desde, hasta } = rangoDe(paginacion)

    return armarPagina(filtrados.slice(desde, hasta + 1), filtrados.length, paginacion)
  }

  async obtenerPorId(id: string): Promise<Documento | null> {
    return this.documentos.find((d) => d.id === id) ?? null
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

  async eliminar(id: string): Promise<void> {
    this.documentos = this.documentos.filter((d) => d.id !== id)
  }

  // Helpers para tests
  reset(): void {
    this.documentos = []
  }
}
