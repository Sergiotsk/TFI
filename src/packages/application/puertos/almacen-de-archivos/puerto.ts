/** Archivo que llega desde el borde y se guarda en el almacenamiento. */
export interface ArchivoParaSubir {
  contenido: ArrayBuffer
  nombreArchivo: string
  mimeType: string
}

/**
 * Almacenamiento de los archivos de documentación.
 *
 * El dominio solo conoce la ruta (`Documento.ruta`). El adaptador real usa un
 * bucket privado de Supabase Storage y entrega URLs firmadas de corta duración;
 * el fake guarda en memoria para los tests.
 */
export interface AlmacenDeArchivos {
  subir(ruta: string, archivo: ArchivoParaSubir): Promise<void>
  eliminar(ruta: string): Promise<void>
  /** URL temporal para descargar el archivo. */
  urlFirmada(ruta: string, segundos: number): Promise<string>
}
