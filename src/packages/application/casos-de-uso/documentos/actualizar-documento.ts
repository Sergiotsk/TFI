import type { Documento, TipoDeDocumento } from '@tfi/domain'
import type { Reloj } from '../../puertos/reloj/puerto'
import type { RepositorioDeDocumentos } from '../../puertos/repositorio-de-documentos/puerto'
import type { RepositorioDePeriodos } from '../../puertos/repositorio-de-periodos/puerto'
import type { RepositorioDePostulaciones } from '../../puertos/repositorio-de-postulaciones/puerto'
import type { Actor } from '../actor'
import { ConflictoDeEstado, NoEncontrado, SolicitudInvalida } from '../errores'
import {
  admitenDocumentos,
  cargarContextoDeDocumento,
  estadoEfectivo,
  exigirGestionDeDocumentos,
  yaEstaValidada,
} from './comun'

export interface CambiosDeDocumento {
  tipo?: TipoDeDocumento
  vigencia?: number
  nombreArchivo?: string
}

/**
 * Corrección de los metadatos de un documento (tipo, vigencia, nombre visible).
 *
 * No toca el estado ni el archivo. Solo Secretaría y Dirección, y solo antes de
 * que la documentación quede validada.
 */
export class ActualizarDocumentoUseCase {
  constructor(
    private readonly documentos: RepositorioDeDocumentos,
    private readonly postulaciones: RepositorioDePostulaciones,
    private readonly periodos: RepositorioDePeriodos,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    actor: Actor,
    documentoId: string,
    cambios: CambiosDeDocumento,
  ): Promise<Documento> {
    exigirGestionDeDocumentos(actor)

    if (cambios.vigencia !== undefined && cambios.vigencia < 0) {
      throw new SolicitudInvalida('La vigencia no puede ser negativa')
    }

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

    const actualizado = documento.conMetadatos(cambios, ahora)
    await this.documentos.guardar(actualizado)

    return actualizado
  }
}
