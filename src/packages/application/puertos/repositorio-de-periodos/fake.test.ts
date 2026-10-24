import { describe, expect, it } from 'vitest'
import { PeriodoDeIngreso } from '@tfi/domain'
import { RepositorioDePostulacionesFake } from '../repositorio-de-postulaciones/fake'
import { probarContratoDeRepositorioDePeriodos } from './contrato'
import { RepositorioDePeriodosFake } from './fake'

let contador = 0

probarContratoDeRepositorioDePeriodos(() => {
  const postulaciones = new RepositorioDePostulacionesFake()
  const repositorio = new RepositorioDePeriodosFake(postulaciones)

  return {
    repositorio,
    institucionId: 'institucion-fake',
    otraInstitucionId: 'otra-institucion-fake',
    crearAspirante: async (dni: string) => {
      contador += 1
      const aspiranteId = `aspirante-fake-${contador}`
      postulaciones.registrarDni(aspiranteId, dni)
      return aspiranteId
    },
    crearPeriodo: async (datos) => {
      contador += 1
      const periodo = new PeriodoDeIngreso(
        `periodo-fake-${contador}`,
        datos?.institucionId ?? 'institucion-fake',
        datos?.nombre ?? `Período ${contador}`,
        datos?.totalCupos ?? 50,
        datos?.cierraEl ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        datos?.diasPlazoPago ?? 10,
        datos?.montoMatriculaCentavos ?? 1_500_000,
      )
      await repositorio.guardar(periodo)
      return periodo
    },
    sembrarPostulacion: async (datos) => postulaciones.sembrar(datos),
  }
})

describe('RepositorioDePeriodosFake', () => {
  it('guardar() actualiza un período existente con el mismo id', async () => {
    const postulaciones = new RepositorioDePostulacionesFake()
    const repositorio = new RepositorioDePeriodosFake(postulaciones)
    const original = new PeriodoDeIngreso(
      'periodo-1',
      'institucion-1',
      'Ingreso 2027',
      50,
      new Date('2026-12-01T00:00:00.000Z'),
      10,
      1_500_000,
    )
    await repositorio.guardar(original)

    await repositorio.guardar(
      new PeriodoDeIngreso(
        'periodo-1',
        'institucion-1',
        'Ingreso 2027',
        80,
        new Date('2026-12-01T00:00:00.000Z'),
        10,
        1_500_000,
      ),
    )

    expect((await repositorio.obtenerPorId('periodo-1'))?.totalCupos).toBe(80)
  })
})
