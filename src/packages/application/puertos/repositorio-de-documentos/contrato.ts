import { describe, expect, it } from 'vitest'
import { Documento } from '@tfi/domain'
import { PAGINACION_POR_DEFECTO } from '../../paginacion'
import type { RepositorioDeDocumentos } from './puerto'

// El entorno provee ids únicos: contra una base real el documento necesita un
// UUID nuevo y la Postulación tiene que existir por la FK.
export interface EntornoDeDocumentos {
  repositorio: RepositorioDeDocumentos
  /** Crea una Postulación real o un id único para la suite. */
  crearPostulacion: () => Promise<string>
  /** Id único de documento; contra Supabase tiene que ser un UUID. */
  crearIdDocumento: () => string
}

function documentoDePrueba(
  id: string,
  postulacionId: string,
  estado: 'PENDIENTE' | 'APROBADO' | 'OBSERVADO' = 'PENDIENTE',
): Documento {
  return new Documento(
    id,
    postulacionId,
    'DNI',
    `/documentos/${postulacionId}/${id}.pdf`,
    'dni.pdf',
    'application/pdf',
    2048,
    365,
    estado,
    null,
    null,
    null,
    estado === 'OBSERVADO' ? 'Falta la firma' : null,
    new Date(),
    new Date(),
  )
}

/** Contrato de `RepositorioDeDocumentos`. */
export function probarContratoRepositorioDeDocumentos(
  crearEntorno: () => EntornoDeDocumentos | Promise<EntornoDeDocumentos>,
) {
  describe('contrato: RepositorioDeDocumentos', () => {
    it('guardar() y obtenerPorId() devuelven el mismo documento', async () => {
      const { repositorio, crearIdDocumento, crearPostulacion } = await crearEntorno()
      const documento = documentoDePrueba(crearIdDocumento(), await crearPostulacion())

      await repositorio.guardar(documento)

      const guardado = await repositorio.obtenerPorId(documento.id)
      expect(guardado).not.toBeNull()
      expect(guardado?.postulacionId).toBe(documento.postulacionId)
      expect(guardado?.ruta).toBe(documento.ruta)
      expect(guardado?.nombreArchivo).toBe(documento.nombreArchivo)
      expect(guardado?.mimeType).toBe(documento.mimeType)
      expect(guardado?.tamanioBytes).toBe(documento.tamanioBytes)
      expect(guardado?.vigencia).toBe(documento.vigencia)
      expect(guardado?.estado).toBe(documento.estado)
    })

    it('obtenerPorId() devuelve null cuando el documento no existe', async () => {
      const { repositorio, crearIdDocumento } = await crearEntorno()
      const documento = await repositorio.obtenerPorId(crearIdDocumento())
      expect(documento).toBeNull()
    })

    it('obtenerPorPostulacion() devuelve solo los documentos de esa postulación', async () => {
      const { repositorio, crearIdDocumento, crearPostulacion } = await crearEntorno()
      const postulacionA = await crearPostulacion()
      const postulacionB = await crearPostulacion()

      await repositorio.guardar(documentoDePrueba(crearIdDocumento(), postulacionA))
      await repositorio.guardar(documentoDePrueba(crearIdDocumento(), postulacionA))
      await repositorio.guardar(documentoDePrueba(crearIdDocumento(), postulacionB))

      const deA = await repositorio.obtenerPorPostulacion(postulacionA)
      expect(deA.length).toBe(2)
      expect(deA.every((d) => d.postulacionId === postulacionA)).toBe(true)

      const deB = await repositorio.obtenerPorPostulacion(postulacionB)
      expect(deB.length).toBe(1)
      expect(deB.every((d) => d.postulacionId === postulacionB)).toBe(true)
    })

    it('listar() filtra por postulación, estado y tipo, y pagina', async () => {
      const { repositorio, crearIdDocumento, crearPostulacion } = await crearEntorno()
      const postulacion = await crearPostulacion()

      await repositorio.guardar(documentoDePrueba(crearIdDocumento(), postulacion, 'PENDIENTE'))
      await repositorio.guardar(documentoDePrueba(crearIdDocumento(), postulacion, 'APROBADO'))
      await repositorio.guardar(documentoDePrueba(crearIdDocumento(), postulacion, 'OBSERVADO'))

      const deLaPostulacion = await repositorio.listar(
        { postulacionId: postulacion },
        PAGINACION_POR_DEFECTO,
      )
      expect(deLaPostulacion.total).toBe(3)

      const aprobados = await repositorio.listar(
        { postulacionId: postulacion, estado: 'APROBADO' },
        PAGINACION_POR_DEFECTO,
      )
      expect(aprobados.items).toHaveLength(1)
      expect(aprobados.items[0]?.estado).toBe('APROBADO')

      const primera = await repositorio.listar(
        { postulacionId: postulacion },
        { pagina: 1, porPagina: 2 },
      )
      const segunda = await repositorio.listar(
        { postulacionId: postulacion },
        { pagina: 2, porPagina: 2 },
      )
      expect(primera.items).toHaveLength(2)
      expect(primera.totalPaginas).toBe(2)
      expect(segunda.items).toHaveLength(1)
    })

    it('eliminar() borra el documento', async () => {
      const { repositorio, crearIdDocumento, crearPostulacion } = await crearEntorno()
      const documento = documentoDePrueba(crearIdDocumento(), await crearPostulacion())

      await repositorio.guardar(documento)
      await repositorio.eliminar(documento.id)

      expect(await repositorio.obtenerPorId(documento.id)).toBeNull()
    })
  })
}
