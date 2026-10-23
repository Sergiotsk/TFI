import type { Documento } from '@tfi/domain'
import type { AlmacenDeArchivos } from '../../puertos/almacen-de-archivos/puerto'
import type { RepositorioDeDocumentos } from '../../puertos/repositorio-de-documentos/puerto'
import type { RepositorioDePeriodos } from '../../puertos/repositorio-de-periodos/puerto'
import type { RepositorioDePostulaciones } from '../../puertos/repositorio-de-postulaciones/puerto'
import type { Actor } from '../actor'
import { NoEncontrado } from '../errores'
import {
  SEGUNDOS_DE_URL_FIRMADA,
  cargarContextoDeDocumento,
  exigirAccesoADocumentos,
} from './comun'

/** Documento con una URL firmada de corta duración para descargarlo. */
export interface DocumentoConUrl {
  documento: Documento
  urlFirmada: string
  expiraEnSegundos: number
}

/**
 * Detalle de un documento + URL firmada.
 *
 * La URL se genera recién después de validar el acceso; el bucket es privado y
 * la firma vence a los cinco minutos.
 */
export class ConsultarDocumentoUseCase {
  constructor(
    private readonly documentos: RepositorioDeDocumentos,
    private readonly postulaciones: RepositorioDePostulaciones,
    private readonly periodos: RepositorioDePeriodos,
    private readonly almacen: AlmacenDeArchivos,
  ) {}

  async ejecutar(actor: Actor, documentoId: string): Promise<DocumentoConUrl> {
    const documento = await this.documentos.obtenerPorId(documentoId)
    if (!documento) throw new NoEncontrado('El documento no existe')

    const contexto = await cargarContextoDeDocumento(
      actor,
      documento.postulacionId,
      this.postulaciones,
      this.periodos,
    )
    exigirAccesoADocumentos(actor, contexto)

    const urlFirmada = await this.almacen.urlFirmada(
      documento.ruta,
      SEGUNDOS_DE_URL_FIRMADA,
    )

    return {
      documento,
      urlFirmada,
      expiraEnSegundos: SEGUNDOS_DE_URL_FIRMADA,
    }
  }
}
