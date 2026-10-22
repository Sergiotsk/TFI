import { describe, expect, it } from 'vitest'
import { Documento } from '@tfi/domain'
import type { RepositorioDeDocumentos } from './puerto'

// Los ids tienen que ser unicos por corrida: contra una base real, guardar dos
// veces el mismo id choca contra la clave primaria.
let contador = 0

function idUnico(prefijo: string): string {
  contador += 1
  return `${prefijo}-${Date.now().toString(36)}-${contador}`
}

export function probarContratoRepositorioDeDocumentos(
  crearRepositorio: () => RepositorioDeDocumentos,
) {
  describe('contrato: RepositorioDeDocumentos', () => {
    it('guardar() y obtenerPorId() devuelven el mismo documento', async () => {
      const repositorio = crearRepositorio()
      const documento = new Documento(
        idUnico('doc'),
        idUnico('postulacion'),
        '/uploads/postulaciones/contrato/dni.pdf',
        365,
        'PENDIENTE',
      )

      await repositorio.guardar(documento)

      const guardado = await repositorio.obtenerPorId(documento.id)
      expect(guardado).not.toBeNull()
      expect(guardado?.postulacionId).toBe(documento.postulacionId)
      expect(guardado?.ruta).toBe(documento.ruta)
      expect(guardado?.vigencia).toBe(documento.vigencia)
      expect(guardado?.estado).toBe(documento.estado)
    })

    it('obtenerPorId() devuelve null cuando el documento no existe', async () => {
      const repositorio = crearRepositorio()
      const documento = await repositorio.obtenerPorId(idUnico('inexistente'))
      expect(documento).toBeNull()
    })

    it('obtenerPorPostulacion() devuelve solo los documentos de esa postulación', async () => {
      const repositorio = crearRepositorio()
      const postulacionA = idUnico('postulacion')
      const postulacionB = idUnico('postulacion')

      await repositorio.guardar(
        new Documento(idUnico('doc'), postulacionA, '/uploads/a.pdf', 30, 'PENDIENTE'),
      )
      await repositorio.guardar(
        new Documento(idUnico('doc'), postulacionA, '/uploads/b.pdf', 30, 'PENDIENTE'),
      )
      await repositorio.guardar(
        new Documento(idUnico('doc'), postulacionB, '/uploads/c.pdf', 30, 'PENDIENTE'),
      )

      const deA = await repositorio.obtenerPorPostulacion(postulacionA)
      expect(deA.length).toBe(2)
      expect(deA.every((d) => d.postulacionId === postulacionA)).toBe(true)

      const deB = await repositorio.obtenerPorPostulacion(postulacionB)
      expect(deB.length).toBe(1)
      expect(deB.every((d) => d.postulacionId === postulacionB)).toBe(true)
    })

    it('obtenerTodos() incluye lo que se acaba de guardar', async () => {
      const repositorio = crearRepositorio()
      const documento = new Documento(
        idUnico('doc'),
        idUnico('postulacion'),
        '/uploads/postulaciones/contrato/constancia.pdf',
        180,
        'APROBADO',
      )

      await repositorio.guardar(documento)

      const todos = await repositorio.obtenerTodos()
      expect(todos.some((d) => d.id === documento.id)).toBe(true)
    })
  })
}
