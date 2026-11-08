import type { ArchivoParaSubir, AlmacenDeArchivos } from './puerto'

/**
 * Almacenamiento en memoria. Las URLs firmadas son previsibles para que los
 * tests puedan verificar que el archivo existe sin salir a la red.
 */
export class AlmacenDeArchivosFake implements AlmacenDeArchivos {
  private readonly archivos = new Map<string, ArchivoParaSubir>()

  async subir(ruta: string, archivo: ArchivoParaSubir): Promise<void> {
    this.archivos.set(ruta, archivo)
  }

  async eliminar(ruta: string): Promise<void> {
    this.archivos.delete(ruta)
  }

  async urlFirmada(ruta: string, segundos: number): Promise<string> {
    if (!this.archivos.has(ruta)) {
      throw new Error(`El archivo no existe: ${ruta}`)
    }

    return `https://almacen.fake/${encodeURIComponent(ruta)}?expira=${segundos}`
  }

  // Helpers para tests
  obtener(ruta: string): ArchivoParaSubir | undefined {
    return this.archivos.get(ruta)
  }

  reset(): void {
    this.archivos.clear()
  }
}
