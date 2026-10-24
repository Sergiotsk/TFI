import { Documento } from '@tfi/domain'
import type { TipoDeDocumento } from '@tfi/domain'
import type { AccionesDeDocumentacion } from '../../puertos/acciones-de-documentacion/puerto'
import type { AlmacenDeArchivos } from '../../puertos/almacen-de-archivos/puerto'
import type { GeneradorDeIds } from '../../puertos/generador-de-ids/puerto'
import type { Reloj } from '../../puertos/reloj/puerto'
import type { RepositorioDeDocumentos } from '../../puertos/repositorio-de-documentos/puerto'
import type { RepositorioDePeriodos } from '../../puertos/repositorio-de-periodos/puerto'
import type { RepositorioDePostulaciones } from '../../puertos/repositorio-de-postulaciones/puerto'
import type { Actor } from '../actor'
import { ConflictoDeEstado, SolicitudInvalida } from '../errores'
import {
  MIME_TYPES_PERMITIDOS,
  TAMANIO_MAXIMO_DE_ARCHIVO,
  admitenDocumentos,
  cargarContextoDeDocumento,
  estadoEfectivo,
  exigirAccesoADocumentos,
  transicionar,
  yaEstaValidada,
} from './comun'

export interface ArchivoDeDocumento {
  contenido: ArrayBuffer
  nombreArchivo: string
  mimeType: string
}

export interface DatosDeNuevoDocumento {
  postulacionId: string
  tipo: TipoDeDocumento
  /** Días de validez del documento; 0 significa sin vencimiento. */
  vigencia: number
  archivo: ArchivoDeDocumento
}

function nombreSeguro(nombre: string): string {
  const limpio = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return (limpio || 'archivo').slice(-80)
}

/**
 * Alta de un documento.
 *
 * El aspirante sube los suyos; Secretaría y Dirección también pueden hacerlo.
 * La primera carga sobre una `VACANTE_CONFIRMADA` mueve la Postulación a
 * `ESPERANDO_DOCUMENTACION`. El archivo va a un bucket privado y la fila de
 * `documentos` guarda solo la ruta y los metadatos.
 *
 * Si la fila no se puede guardar, se borra el archivo recién subido para no
 * dejar basura en el storage.
 */
export class SubirDocumentoUseCase {
  constructor(
    private readonly documentos: RepositorioDeDocumentos,
    private readonly postulaciones: RepositorioDePostulaciones,
    private readonly periodos: RepositorioDePeriodos,
    private readonly acciones: AccionesDeDocumentacion,
    private readonly almacen: AlmacenDeArchivos,
    private readonly generadorDeIds: GeneradorDeIds,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(actor: Actor, datos: DatosDeNuevoDocumento): Promise<Documento> {
    if (datos.vigencia < 0) {
      throw new SolicitudInvalida('La vigencia no puede ser negativa')
    }
    if (datos.archivo.contenido.byteLength === 0) {
      throw new SolicitudInvalida('El archivo está vacío')
    }
    if (datos.archivo.contenido.byteLength > TAMANIO_MAXIMO_DE_ARCHIVO) {
      throw new SolicitudInvalida('El archivo supera el máximo de 10 MB')
    }
    if (!(MIME_TYPES_PERMITIDOS as readonly string[]).includes(datos.archivo.mimeType)) {
      throw new SolicitudInvalida('Solo se aceptan archivos PDF, JPG o PNG')
    }

    const contexto = await cargarContextoDeDocumento(
      actor,
      datos.postulacionId,
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

    const id = this.generadorDeIds.nuevo()
    const nombreArchivo = nombreSeguro(datos.archivo.nombreArchivo)
    const ruta = `${contexto.periodo.institucionId}/${datos.postulacionId}/${id}-${nombreArchivo}`

    const documento = new Documento(
      id,
      datos.postulacionId,
      datos.tipo,
      ruta,
      datos.archivo.nombreArchivo,
      datos.archivo.mimeType,
      datos.archivo.contenido.byteLength,
      datos.vigencia,
      'PENDIENTE',
      actor.perfilId,
      null,
      null,
      null,
      ahora,
      ahora,
    )

    await this.almacen.subir(ruta, {
      contenido: datos.archivo.contenido,
      nombreArchivo,
      mimeType: datos.archivo.mimeType,
    })

    try {
      await this.documentos.guardar(documento)

      if (estado === 'VACANTE_CONFIRMADA') {
        await transicionar(
          datos.postulacionId,
          'ESPERANDO_DOCUMENTACION',
          this.acciones,
        )
      }
    } catch (error) {
      await this.almacen.eliminar(ruta).catch(() => undefined)
      await this.documentos.eliminar(id).catch(() => undefined)
      throw error
    }

    return documento
  }
}
