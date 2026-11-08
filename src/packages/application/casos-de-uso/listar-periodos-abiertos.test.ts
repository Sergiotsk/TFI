import { describe, expect, it } from 'vitest'
import { PeriodoDeIngreso } from '@tfi/domain'
import { RelojFijo } from '../puertos/reloj/fake'
import { RepositorioDePeriodosFake } from '../puertos/repositorio-de-periodos/fake'
import { RepositorioDePostulacionesFake } from '../puertos/repositorio-de-postulaciones/fake'
import type { Actor } from './actor'
import { ListarPeriodosAbiertosUseCase } from './listar-periodos-abiertos'

const AHORA = new Date('2026-10-22T00:00:00.000Z')

const actor: Actor = {
  perfilId: 'perfil-1',
  rol: 'ASPIRANTE',
  institucionId: 'institucion-1',
}

async function armarMundo() {
  const postulaciones = new RepositorioDePostulacionesFake()
  const periodos = new RepositorioDePeriodosFake(postulaciones)

  await periodos.guardar(
    new PeriodoDeIngreso(
      'periodo-1',
      'institucion-1',
      'Primer cuatrimestre 2027',
      50,
      new Date('2027-03-01T00:00:00.000Z'),
      3,
      9_400_000,
    ),
  )
  await periodos.guardar(
    new PeriodoDeIngreso(
      'periodo-2',
      'institucion-1',
      'Segundo cuatrimestre 2027',
      40,
      new Date('2027-08-01T00:00:00.000Z'),
      5,
      9_400_000,
    ),
  )
  // Ya cerró: no debe aparecer.
  await periodos.guardar(
    new PeriodoDeIngreso(
      'periodo-cerrado',
      'institucion-1',
      'Cuatrimestre pasado',
      50,
      new Date('2026-08-01T00:00:00.000Z'),
      3,
      9_400_000,
    ),
  )
  // Otra institución: no debe aparecer.
  await periodos.guardar(
    new PeriodoDeIngreso(
      'periodo-otra-institucion',
      'institucion-2',
      'Ingreso de otra facultad',
      50,
      new Date('2027-03-01T00:00:00.000Z'),
      3,
      9_400_000,
    ),
  )

  return { caso: new ListarPeriodosAbiertosUseCase(periodos, new RelojFijo(AHORA)) }
}

describe('ListarPeriodosAbiertos', () => {
  it('devuelve solo los abiertos de la institución del actor, por cierre ascendente', async () => {
    const { caso } = await armarMundo()

    const resultado = await caso.ejecutar(actor)

    expect(resultado.map((periodo) => periodo.id)).toEqual(['periodo-1', 'periodo-2'])
  })

  it('lo puede consultar cualquier rol autenticado', async () => {
    const { caso } = await armarMundo()

    const resultado = await caso.ejecutar({ ...actor, rol: 'TESORERIA' })

    expect(resultado).toHaveLength(2)
  })

  it('incluye un período que cierra justo ahora', async () => {
    const postulaciones = new RepositorioDePostulacionesFake()
    const periodos = new RepositorioDePeriodosFake(postulaciones)
    await periodos.guardar(
      new PeriodoDeIngreso('periodo-hoy', 'institucion-1', 'Cierra hoy', 10, AHORA, 3, 1_000),
    )
    const caso = new ListarPeriodosAbiertosUseCase(periodos, new RelojFijo(AHORA))

    const resultado = await caso.ejecutar(actor)

    expect(resultado.map((periodo) => periodo.id)).toEqual(['periodo-hoy'])
  })
})
