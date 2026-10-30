import type { ProveedorDePago } from '@tfi/domain'

/**
 * Cómo es el informe de pagos de una institución (ADR 0011): qué columnas buscar en la planilla, de qué
 * proveedor son los pagos y, si hace falta, qué concepto tiene que traer la descripción.
 *
 * Los nombres de columna se comparan sin acentos, sin mayúsculas y sin los espacios de relleno.
 */
export interface PerfilDeInforme {
  readonly proveedor: ProveedorDePago
  readonly columnas: {
    readonly fecha: string
    readonly referencia: string
    readonly dni: string
    readonly monto: string
    /** Obligatoria solo si hay `concepto`. */
    readonly descripcion?: string
  }
  /** Si está, las filas cuya descripción no lo incluye se descartan. */
  readonly concepto?: string
}
