import type { PagoInformado } from '@tfi/domain'

/** Un problema en una línea del archivo (en una planilla, el número de fila). */
export interface ErrorDeLectura {
  linea: number
  mensaje: string
}

export type ResultadoDeLectura =
  /** `descartadas`: filas que el filtro de concepto del informe dejó afuera. */
  | { ok: true; pagos: PagoInformado[]; descartadas: number }
  | { ok: false; errores: ErrorDeLectura[] }

/**
 * Traduce el archivo del informe de pagos a `PagoInformado[]`.
 *
 * Recibe los bytes del archivo tal como lo sube Tesorería: el formato (planilla,
 * columnas, encabezado) es asunto del adaptador (ADR 0011). Si alguna línea es
 * inválida se rechaza el archivo entero, con todas las líneas y el motivo, para
 * que Tesorería lo corrija y lo vuelva a subir.
 */
export interface LectorDeInformeDePagos {
  leer(contenido: Uint8Array): Promise<ResultadoDeLectura>
}
