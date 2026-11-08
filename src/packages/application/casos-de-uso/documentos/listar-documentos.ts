import type { Documento } from '@tfi/domain'
import type { Pagina, Paginacion } from '../../paginacion'
import type { FiltrosDeDocumento } from '../../puertos/repositorio-de-documentos/puerto'
import type { RepositorioDeDocumentos } from '../../puertos/repositorio-de-documentos/puerto'
import type { RepositorioDePeriodos } from '../../puertos/repositorio-de-periodos/puerto'
import type { RepositorioDePostulaciones } from '../../puertos/repositorio-de-postulaciones/puerto'
import type { Actor } from '../actor'
import { NoAutorizado } from '../errores'
import {
  cargarContextoDeDocumento,
  exigirAccesoADocumentos,
  exigirGestionDeDocumentos,
} from './comun'

/**
 * Listado paginado de documentos.
 *
 * Secretaría y Dirección ven los de su institución, con filtros opcionales por
 * Postulación, estado y tipo. Un aspirante solo puede pedir los de una
 * Postulación propia: no existe un listado global para él.
 */
export class ListarDocumentosUseCase {
  constructor(
    private readonly documentos: RepositorioDeDocumentos,
    private readonly postulaciones: RepositorioDePostulaciones,
    private readonly periodos: RepositorioDePeriodos,
  ) {}

  async ejecutar(
    actor: Actor,
    filtros: FiltrosDeDocumento,
    paginacion: Paginacion,
  ): Promise<Pagina<Documento>> {
    if (actor.rol === 'ASPIRANTE') {
      if (filtros.postulacionId === undefined) {
        throw new NoAutorizado('Indicá de qué Postulación querés ver los documentos')
      }

      const contexto = await cargarContextoDeDocumento(
        actor,
        filtros.postulacionId,
        this.postulaciones,
        this.periodos,
      )
      exigirAccesoADocumentos(actor, contexto)

      return this.documentos.listar(filtros, paginacion)
    }

    exigirGestionDeDocumentos(actor)

    if (filtros.postulacionId !== undefined) {
      await cargarContextoDeDocumento(
        actor,
        filtros.postulacionId,
        this.postulaciones,
        this.periodos,
      )
    }

    return this.documentos.listar(filtros, paginacion)
  }
}
