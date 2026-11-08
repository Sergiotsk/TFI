import { Documento } from '@tfi/domain'
import type { AlmacenDeArchivos } from '../../puertos/almacen-de-archivos/puerto'
import type { GeneradorDeIds } from '../../puertos/generador-de-ids/puerto'
import type { Reloj } from '../../puertos/reloj/puerto'
import type { RepositorioDeDocumentos } from '../../puertos/repositorio-de-documentos/puerto'
import type { RepositorioDePeriodos } from '../../puertos/repositorio-de-periodos/puerto'
import type { RepositorioDePostulaciones } from '../../puertos/repositorio-de-postulaciones/puerto'
import { exigirRol } from '../actor'
import type { Actor } from '../actor'
import { ConflictoDeEstado, NoEncontrado } from '../errores'
import {
  admitenDocumentos,
  cargarContextoDeDocumento,
  estadoEfectivo,
  exigirAccesoADocumentos,
  exigirArchivoValido,
  nombreSeguroDeArchivo,
  yaEstaValidada,
} from './comun'
import type { ArchivoDeDocumento } from './subir-documento'

/**
 * El aspirante cambia un archivo que subió por error, sin esperar a que
 * Secretaría lo observe. Solo mientras el documento siga PENDIENTE: lo revisado
 * pasa por Secretaría.
 *
 * Una Postulación tiene un solo documento activo por tipo, así que la fila vieja
 * se borra antes de crear la nueva. El archivo nuevo se sube primero y el viejo
 * se borra al final: si algo falla, el documento original queda como estaba.
 */
export class ReemplazarDocumentoUseCase {
  constructor(
    private readonly documentos: RepositorioDeDocumentos,
    private readonly postulaciones: RepositorioDePostulaciones,
    private readonly periodos: RepositorioDePeriodos,
    private readonly almacen: AlmacenDeArchivos,
    private readonly generadorDeIds: GeneradorDeIds,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    actor: Actor,
    documentoId: string,
    archivo: ArchivoDeDocumento,
  ): Promise<Documento> {
    exigirRol(actor, 'ASPIRANTE')
    exigirArchivoValido(archivo)

    const actual = await this.documentos.obtenerPorId(documentoId)
    if (!actual) throw new NoEncontrado('El documento no existe')

    const contexto = await cargarContextoDeDocumento(
      actor,
      actual.postulacionId,
      this.postulaciones,
      this.periodos,
    )
    exigirAccesoADocumentos(actor, contexto)

    const ahora = this.reloj.ahora()
    const estado = estadoEfectivo(contexto.postulacion, ahora)
    if (yaEstaValidada(estado)) {
      throw new ConflictoDeEstado('La documentación ya fue validada')
    }
    if (!admitenDocumentos(estado)) {
      throw new ConflictoDeEstado('La Postulación todavía no está en la etapa de documentación')
    }
    if (actual.estado !== 'PENDIENTE') {
      throw new ConflictoDeEstado('Solo se puede reemplazar un documento que todavía no se revisó')
    }

    const id = this.generadorDeIds.nuevo()
    const nombreArchivo = nombreSeguroDeArchivo(archivo.nombreArchivo)
    const ruta = `${contexto.periodo.institucionId}/${actual.postulacionId}/${id}-${nombreArchivo}`
    const nuevo = new Documento(
      id,
      actual.postulacionId,
      actual.tipo,
      ruta,
      archivo.nombreArchivo,
      archivo.mimeType,
      archivo.contenido.byteLength,
      actual.vigencia,
      'PENDIENTE',
      actor.perfilId,
      null,
      null,
      null,
      ahora,
      ahora,
    )

    await this.almacen.subir(ruta, {
      contenido: archivo.contenido,
      nombreArchivo,
      mimeType: archivo.mimeType,
    })

    try {
      await this.documentos.eliminar(actual.id)
      await this.documentos.guardar(nuevo)
    } catch (error) {
      await this.restaurar(actual)
      await this.almacen.eliminar(ruta).catch(() => undefined)
      throw error
    }

    await this.almacen.eliminar(actual.ruta).catch(() => undefined)

    return nuevo
  }

  /** La baja pudo no borrar nada (RLS no avisa): solo se repone si la fila ya no está. */
  private async restaurar(documento: Documento): Promise<void> {
    const sigue = await this.documentos.obtenerPorId(documento.id).catch(() => documento)
    if (!sigue) await this.documentos.guardar(documento).catch(() => undefined)
  }
}
