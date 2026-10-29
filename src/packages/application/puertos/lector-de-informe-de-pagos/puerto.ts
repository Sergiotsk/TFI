import type { PagoInformado } from '@tfi/domain'

/** Un problema en una línea del archivo (la 1 es el encabezado). */
export interface ErrorDeLectura {
  linea: number
  mensaje: string
}

export type ResultadoDeLectura =
  | { ok: true; pagos: PagoInformado[] }
  | { ok: false; errores: ErrorDeLectura[] }

/**
 * Traduce el archivo del informe de pagos a `PagoInformado[]`.
 *
 * El formato real lo tiene que pasar Administración (T04): hasta entonces hay
 * un adaptador con un formato provisorio, y cuando llegue el real solo cambia
 * el adaptador. Si alguna línea es inválida se rechaza el archivo entero, con
 * todas las líneas y el motivo, para que Tesorería lo corrija y lo vuelva a subir.
 */
export interface LectorDeInformeDePagos {
  leer(contenido: string): ResultadoDeLectura
}
