import type { Documento, EstadoDocumento } from '@tfi/domain'
import type { AccionesDeDocumentacion } from '../../puertos/acciones-de-documentacion/puerto'
import type { Reloj } from '../../puertos/reloj/puerto'
import type { RepositorioDeDocumentos } from '../../puertos/repositorio-de-documentos/puerto'
import type { RepositorioDePeriodos } from '../../puertos/repositorio-de-periodos/puerto'
import type { RepositorioDePostulaciones } from '../../puertos/repositorio-de-postulaciones/puerto'
import type { Actor } from '../actor'
import { ConflictoDeEstado, NoEncontrado } from '../errores'
import {
  admitenDocumentos,
  cargarContextoDeDocumento,
  estadoEfectivo,
  exigirGestionDeDocumentos,
  recalcularEtapaDeDocumentacion,
  yaEstaValidada,
} from './comun'

export interface RevisionDeDocumento {
  estado: EstadoDocumento
  observaciones?: string | null
}

/**
 * Revisión de un documento por Secretaría o Dirección.
 *
 * Después de guardar el estado del documento se recalcula la etapa de la
 * Postulación: si hay alguno observado queda `OBSERVADO`; si todos están
 * aprobados pasa a `DOCUMENTACION_VALIDADA`; en el resto de los casos queda
 * `DOCUMENTACION_EN_REVISION`.
 */
export class RevisarDocumentoUseCase {
  constructor(
    private readonly documentos: RepositorioDeDocumentos,
    private readonly postulaciones: RepositorioDePostulaciones,
    private readonly periodos: RepositorioDePeriodos,
    private readonly acciones: AccionesDeDocumentacion,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    actor: Actor,
    documentoId: string,
    revision: RevisionDeDocumento,
  ): Promise<Documento> {
    exigirGestionDeDocumentos(actor)

    const documento = await this.documentos.obtenerPorId(documentoId)
    if (!documento) throw new NoEncontrado('El documento no existe')

    const contexto = await cargarContextoDeDocumento(
      actor,
      documento.postulacionId,
      this.postulaciones,
      this.periodos,
    )

    const ahora = this.reloj.ahora()
    const estado = estadoEfectivo(contexto.postulacion, ahora)
    if (yaEstaValidada(estado)) {
      throw new ConflictoDeEstado('La documentación ya fue validada')
    }
    if (!admitenDocumentos(estado)) {
      throw new ConflictoDeEstado('La Postulación todavía no está en la etapa de documentación')
    }

    const revisado = documento.revisar(
      revision.estado,
      actor.perfilId,
      ahora,
      revision.observaciones,
    )

    await this.documentos.guardar(revisado)

    const todos = await this.documentos.obtenerPorPostulacion(documento.postulacionId)
    await recalcularEtapaDeDocumentacion(
      documento.postulacionId,
      this.acciones,
      this.postulaciones,
      todos,
      this.reloj,
    )

    return revisado
  }
}
