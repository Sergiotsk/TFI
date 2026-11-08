import { describe, expect, it } from 'vitest'
import { PeriodoDeIngreso } from '@tfi/domain'
import { probarContratoDeRepositorioDePostulaciones } from './contrato'
import { RepositorioDePostulacionesFake } from './fake'

let contador = 0

function unPeriodoDePrueba(datos?: {
  nombre?: string
  institucionId?: string
  totalCupos?: number
  cierraEl?: Date
  diasPlazoPago?: number
  montoMatriculaCentavos?: number
}): PeriodoDeIngreso {
  contador += 1

  return new PeriodoDeIngreso(
    `periodo-fake-${contador}`,
    datos?.institucionId ?? 'institucion-fake',
    datos?.nombre ?? `Período ${contador}`,
    datos?.totalCupos ?? 50,
    datos?.cierraEl ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    datos?.diasPlazoPago ?? 10,
    datos?.montoMatriculaCentavos ?? 1_500_000,
  )
}

probarContratoDeRepositorioDePostulaciones(() => {
  const repositorio = new RepositorioDePostulacionesFake()

  return {
    repositorio,
    crearAspirante: async (dni: string) => {
      contador += 1
      const aspiranteId = `aspirante-fake-${contador}`
      repositorio.registrarDni(aspiranteId, dni)
      return aspiranteId
    },
    crearPeriodo: async (datos) => unPeriodoDePrueba(datos),
    sembrarPostulacion: async (datos) => repositorio.sembrar(datos),
  }
})

describe('RepositorioDePostulacionesFake', () => {
  it('guardarTransicion() devuelve conflicto si la Postulación no existe', async () => {
    const repositorio = new RepositorioDePostulacionesFake()
    const creada = await repositorio.crear('aspirante-1', 'periodo-1')
    const otroRepositorio = new RepositorioDePostulacionesFake()

    expect(await otroRepositorio.guardarTransicion(creada, creada)).toBe('conflicto')
  })

  it('sembrar() completa el vencimiento de una Postulación pendiente', () => {
    const repositorio = new RepositorioDePostulacionesFake()

    const sembrada = repositorio.sembrar({
      aspiranteId: 'aspirante-1',
      periodoId: 'periodo-1',
      estado: 'PAGO_PENDIENTE',
    })

    expect(sembrada.venceEl).not.toBeNull()
  })
})
