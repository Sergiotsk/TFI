import type { AlmacenDeArchivos } from '../../puertos/almacen-de-archivos/puerto'
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
  exigirAccesoADocumentos,
  yaEstaValidada,
} from './comun'

/**
 * Baja de un documento.
 *
 * El aspirante puede borrar los propios (por ejemplo, si subió el archivo
 * equivocado); Secretaría y Dirección pueden borrar cualquiera de su
 * institución. No se toca después de la validación.
 */
export class EliminarDocumentoUseCase {
  constructor(
    private readonly documentos: RepositorioDeDocumentos,
    private readonly postulaciones: RepositorioDePostulaciones,
    private readonly periodos: RepositorioDePeriodos,
    private readonly almacen: AlmacenDeArchivos,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(actor: Actor, documentoId: string): Promise<void> {
    const documento = await this.documentos.obtenerPorId(documentoId)
    if (!documento) throw new NoEncontrado('El documento no existe')

    const contexto = await cargarContextoDeDocumento(
      actor,
      documento.postulacionId,
      this.postulaciones,
      this.periodos,
    )
    exigirAccesoADocumentos(actor, contexto)

    const estado = estadoEfectivo(contexto.postulacion, this.reloj.ahora())
    if (yaEstaValidada(estado)) {
      throw new ConflictoDeEstado('La documentación ya fue validada')
    }
    if (!admitenDocumentos(estado)) {
      throw new ConflictoDeEstado('La Postulación todavía no está en la etapa de documentación')
    }

    await this.almacen.eliminar(documento.ruta)
    await this.documentos.eliminar(documento.id)
  }
}
