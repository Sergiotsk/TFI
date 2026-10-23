import { describe, expect, it } from 'vitest'
import type { EstadoPostulacion } from '@tfi/domain'
import { RelojFijo } from '../reloj/fake'
import { RepositorioDePostulacionesFake } from '../repositorio-de-postulaciones/fake'
import { probarContratoDeAccionesDeDocumentacion } from './contrato'
import { AccionesDeDocumentacionFake } from './fake'

const AHORA = new Date('2026-10-20T00:00:00.000Z')

probarContratoDeAccionesDeDocumentacion(() => {
  const postulaciones = new RepositorioDePostulacionesFake()
  const acciones = new AccionesDeDocumentacionFake(postulaciones, new RelojFijo(AHORA))

  return {
    acciones,
    crearPostulacion: async (estado: EstadoPostulacion) =>
      postulaciones.sembrar({ aspiranteId: 'aspirante-1', periodoId: 'periodo-1', estado }).id,
    estadoDe: async (postulacionId: string) =>
      (await postulaciones.obtenerPorId(postulacionId))?.estado ?? null,
  }
})

describe('AccionesDeDocumentacionFake', () => {
  it('reutiliza la concurrencia optimista del repositorio', async () => {
    const postulaciones = new RepositorioDePostulacionesFake()
    const acciones = new AccionesDeDocumentacionFake(postulaciones, new RelojFijo(AHORA))
    const postulacion = postulaciones.sembrar({
      aspiranteId: 'aspirante-1',
      periodoId: 'periodo-1',
      estado: 'ESPERANDO_DOCUMENTACION',
    })

    expect(await acciones.transicionar(postulacion.id, 'DOCUMENTACION_EN_REVISION')).toBe('OK')
    expect((await postulaciones.obtenerPorId(postulacion.id))?.estado).toBe(
      'DOCUMENTACION_EN_REVISION',
    )
  })
})
