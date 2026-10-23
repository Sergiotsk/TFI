import type { EstadoDocumento, TipoDeDocumento } from './estado'
import { TRANSICIONES_DE_DOCUMENTO } from './estado'
import {
  ObservacionDeDocumentoRequerida,
  TransicionDeDocumentoInvalida,
} from './errores'

/**
 * Un documento de una Postulación.
 *
 * La documentación se revisa después de que el pago acredite la vacante: es el
 * estado `ESPERANDO_DOCUMENTACION` del ciclo de vida de la Postulación.
 *
 * Es inmutable: `revisar` devuelve un documento nuevo con el mismo id y la
 * misma ruta. La ruta apunta al objeto en Supabase Storage; el archivo en sí no
 * lo maneja el dominio.
 */
export class Documento {
  constructor(
    readonly id: string,
    readonly postulacionId: string,
    readonly tipo: TipoDeDocumento,
    readonly ruta: string,
    readonly nombreArchivo: string,
    readonly mimeType: string,
    readonly tamanioBytes: number,
    readonly vigencia: number,
    readonly estado: EstadoDocumento,
    readonly subidoPor: string | null,
    readonly revisadoPor: string | null,
    readonly revisadoEl: Date | null,
    readonly observaciones: string | null,
    readonly creadoEl: Date,
    readonly actualizadoEl: Date,
  ) {
    if (vigencia < 0) throw new Error('La vigencia no puede ser negativa')
    if (tamanioBytes < 0) throw new Error('El tamaño del archivo no puede ser negativo')
    if (estado === 'OBSERVADO' && (observaciones === null || observaciones.trim().length === 0)) {
      throw new ObservacionDeDocumentoRequerida()
    }
  }

  /**
   * Revisión del personal: cambia el estado y registra quién y cuándo.
   *
   * Observar exige un motivo. Aprobar o reabrir limpian la observación
   * anterior; reabrir además borra la marca de revisión.
   */
  revisar(
    hacia: EstadoDocumento,
    revisorId: string,
    ahora: Date,
    observaciones?: string | null,
  ): Documento {
    if (!TRANSICIONES_DE_DOCUMENTO[this.estado].includes(hacia)) {
      throw new TransicionDeDocumentoInvalida(this.estado, hacia)
    }

    const motivo = observaciones?.trim() ?? ''
    if (hacia === 'OBSERVADO' && motivo.length === 0) {
      throw new ObservacionDeDocumentoRequerida()
    }

    return new Documento(
      this.id,
      this.postulacionId,
      this.tipo,
      this.ruta,
      this.nombreArchivo,
      this.mimeType,
      this.tamanioBytes,
      this.vigencia,
      hacia,
      this.subidoPor,
      hacia === 'PENDIENTE' ? null : revisorId,
      hacia === 'PENDIENTE' ? null : ahora,
      hacia === 'OBSERVADO' ? motivo : null,
      this.creadoEl,
      ahora,
    )
  }

  /** Cambios de metadatos que no son de estado (tipo, vigencia, nombre). */
  conMetadatos(
    cambios: {
      tipo?: TipoDeDocumento
      vigencia?: number
      nombreArchivo?: string
    },
    ahora: Date,
  ): Documento {
    return new Documento(
      this.id,
      this.postulacionId,
      cambios.tipo ?? this.tipo,
      this.ruta,
      cambios.nombreArchivo ?? this.nombreArchivo,
      this.mimeType,
      this.tamanioBytes,
      cambios.vigencia ?? this.vigencia,
      this.estado,
      this.subidoPor,
      this.revisadoPor,
      this.revisadoEl,
      this.observaciones,
      this.creadoEl,
      ahora,
    )
  }
}
