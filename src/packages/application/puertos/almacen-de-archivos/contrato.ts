import { describe, expect, it } from 'vitest'
import type { AlmacenDeArchivos } from './puerto'

let contador = 0

function rutaUnica(): string {
  contador += 1
  return `institucion/postulacion/archivo-${Date.now().toString(36)}-${contador}.pdf`
}

/** Contrato de `AlmacenDeArchivos`: subir, firmar y borrar. */
export function probarContratoDeAlmacenDeArchivos(
  crearAlmacen: () => AlmacenDeArchivos,
) {
  describe('contrato: AlmacenDeArchivos', () => {
    it('subir() guarda el archivo y urlFirmada() devuelve una URL temporal', async () => {
      const almacen = crearAlmacen()
      const ruta = rutaUnica()

      await almacen.subir(ruta, {
        contenido: new Uint8Array([37, 80, 68, 70]).buffer,
        nombreArchivo: 'dni.pdf',
        mimeType: 'application/pdf',
      })

      const url = await almacen.urlFirmada(ruta, 60)
      expect(url).toMatch(/^https?:\/\//)
      expect(url.length).toBeGreaterThan(0)

      await almacen.eliminar(ruta)
    })

    it('eliminar() borra el archivo y luego urlFirmada() falla', async () => {
      const almacen = crearAlmacen()
      const ruta = rutaUnica()

      await almacen.subir(ruta, {
        contenido: new Uint8Array([1, 2, 3]).buffer,
        nombreArchivo: 'constancia.jpg',
        mimeType: 'image/jpeg',
      })
      await almacen.eliminar(ruta)

      await expect(almacen.urlFirmada(ruta, 60)).rejects.toThrow()
    })

    it('urlFirmada() falla si el archivo nunca se subió', async () => {
      const almacen = crearAlmacen()

      await expect(almacen.urlFirmada(rutaUnica(), 60)).rejects.toThrow()
    })
  })
}
