import { describe, expect, it } from 'vitest'
import { PeriodoDeIngreso, PeriodoCerrado, PostulacionDuplicada } from '@tfi/domain'
import { RelojFijo } from '../puertos/reloj/fake'
import { RepositorioDePeriodosFake } from '../puertos/repositorio-de-periodos/fake'
import { RepositorioDePostulacionesFake } from '../puertos/repositorio-de-postulaciones/fake'
import type { Actor } from './actor'
import { CrearPostulacionUseCase } from './crear-postulacion'
import { NoAutorizado, NoEncontrado } from './errores'

const AHORA = new Date('2026-10-20T00:00:00.000Z')
const CIERRE = new Date('2026-12-01T00:00:00.000Z')

const aspirante: Actor = {
  perfilId: 'aspirante-1',
  rol: 'ASPIRANTE',
  institucionId: 'institucion-1',
}

async function armarMundo(opciones: { cierraEl?: Date } = {}) {
  const reloj = new RelojFijo(AHORA)
  const postulaciones = new RepositorioDePostulacionesFake()
  const periodos = new RepositorioDePeriodosFake(postulaciones)
  await periodos.guardar(
    new PeriodoDeIngreso(
      'periodo-1',
      'institucion-1',
      'Ingreso 2027',
      50,
      opciones.cierraEl ?? CIERRE,
      10,
      1_500_000,
    ),
  )

  return {
    caso: new CrearPostulacionUseCase(postulaciones, periodos, reloj),
    postulaciones,
  }
}

describe('CrearPostulacion', () => {
  it('crea la Postulación para el aspirante autenticado', async () => {
    const { caso } = await armarMundo()

    const creada = await caso.ejecutar(aspirante, 'periodo-1')

    expect(creada.estado).toBe('PREINSCRIPTO')
    expect(creada.numero).toBe('000001')
    expect(creada.venceEl).toBeNull()
    expect(creada.aviso).toBeNull()
  })

  it('solo la puede crear un ASPIRANTE', async () => {
    const { caso } = await armarMundo()

    await expect(
      caso.ejecutar({ ...aspirante, rol: 'SECRETARIA' }, 'periodo-1'),
    ).rejects.toThrow(NoAutorizado)
  })

  it('no deja crear en un período cerrado', async () => {
    const { caso } = await armarMundo({ cierraEl: new Date('2026-10-19T00:00:00.000Z') })

    await expect(caso.ejecutar(aspirante, 'periodo-1')).rejects.toThrow(PeriodoCerrado)
  })

  it('no deja crear en un período inexistente', async () => {
    const { caso } = await armarMundo()

    await expect(caso.ejecutar(aspirante, 'no-existe')).rejects.toThrow(NoEncontrado)
  })

  it('no deja tener dos Postulaciones activas en el mismo período', async () => {
    const { caso } = await armarMundo()
    await caso.ejecutar(aspirante, 'periodo-1')

    await expect(caso.ejecutar(aspirante, 'periodo-1')).rejects.toThrow(PostulacionDuplicada)
  })
})
