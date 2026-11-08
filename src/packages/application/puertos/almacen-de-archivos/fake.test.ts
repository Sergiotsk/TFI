import { describe, expect, it } from 'vitest'
import { probarContratoDeAlmacenDeArchivos } from './contrato'
import { AlmacenDeArchivosFake } from './fake'

probarContratoDeAlmacenDeArchivos(() => new AlmacenDeArchivosFake())

describe('AlmacenDeArchivosFake', () => {
  it('firma URLs previsibles para los tests', async () => {
    const almacen = new AlmacenDeArchivosFake()
    await almacen.subir('institucion/postulacion/dni.pdf', {
      contenido: new Uint8Array([1]).buffer,
      nombreArchivo: 'dni.pdf',
      mimeType: 'application/pdf',
    })

    const url = await almacen.urlFirmada('institucion/postulacion/dni.pdf', 60)

    expect(url).toContain('almacen.fake')
    expect(url).toContain('expira=60')
  })

  it('guarda el contenido que después se puede recuperar', async () => {
    const almacen = new AlmacenDeArchivosFake()
    const contenido = new Uint8Array([37, 80, 68, 70]).buffer

    await almacen.subir('ruta/dni.pdf', {
      contenido,
      nombreArchivo: 'dni.pdf',
      mimeType: 'application/pdf',
    })

    expect(almacen.obtener('ruta/dni.pdf')?.contenido).toBe(contenido)
  })
})
