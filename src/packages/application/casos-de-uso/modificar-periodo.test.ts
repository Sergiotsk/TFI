import { describe, expect, it } from 'vitest'
import { CuposPorDebajoDeConfirmadas, PeriodoDeIngreso } from '@tfi/domain'
import { RepositorioDePeriodosFake } from '../puertos/repositorio-de-periodos/fake'
import { RepositorioDePostulacionesFake } from '../puertos/repositorio-de-postulaciones/fake'
import type { Actor } from './actor'
import { NoAutorizado, NoEncontrado } from './errores'
import { ModificarPeriodoUseCase } from './modificar-periodo'

const secretaria: Actor = {
  perfilId: 'perfil-secretaria',
  rol: 'SECRETARIA',
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
      10,
      new Date('2027-03-01T00:00:00.000Z'),
      3,
      9_400_000,
    ),
  )

  return {
    caso: new ModificarPeriodoUseCase(periodos),
    periodos,
    postulaciones,
  }
}

describe('ModificarPeriodo', () => {
  it('actualiza solo los campos que recibe', async () => {
    const { caso, periodos } = await armarMundo()

    const actualizado = await caso.ejecutar(secretaria, 'periodo-1', { totalCupos: 20 })

    expect(actualizado.nombre).toBe('Primer cuatrimestre 2027')
    expect(actualizado.totalCupos).toBe(20)
    expect(actualizado.montoMatriculaCentavos).toBe(9_400_000)
    expect((await periodos.obtenerPorId('periodo-1'))?.totalCupos).toBe(20)
  })

  it('también lo puede modificar DIRECCION', async () => {
    const { caso } = await armarMundo()

    await expect(
      caso.ejecutar({ ...secretaria, rol: 'DIRECCION' }, 'periodo-1', { nombre: 'Otro nombre' }),
    ).resolves.toBeDefined()
  })

  it('no deja bajar los cupos por debajo de las vacantes confirmadas', async () => {
    const { caso, postulaciones } = await armarMundo()
    postulaciones.sembrar({ aspiranteId: 'a-1', periodoId: 'periodo-1', estado: 'VACANTE_CONFIRMADA' })
    postulaciones.sembrar({ aspiranteId: 'a-2', periodoId: 'periodo-1', estado: 'VACANTE_CONFIRMADA' })

    await expect(caso.ejecutar(secretaria, 'periodo-1', { totalCupos: 1 })).rejects.toThrow(
      CuposPorDebajoDeConfirmadas,
    )
  })

  it('permite bajar los cupos hasta las confirmadas', async () => {
    const { caso, postulaciones } = await armarMundo()
    postulaciones.sembrar({ aspiranteId: 'a-1', periodoId: 'periodo-1', estado: 'VACANTE_CONFIRMADA' })

    const actualizado = await caso.ejecutar(secretaria, 'periodo-1', { totalCupos: 1 })

    expect(actualizado.totalCupos).toBe(1)
  })

  it('no lo pueden modificar ASPIRANTE ni TESORERIA', async () => {
    const { caso } = await armarMundo()

    await expect(
      caso.ejecutar({ ...secretaria, rol: 'ASPIRANTE' }, 'periodo-1', { totalCupos: 5 }),
    ).rejects.toThrow(NoAutorizado)
    await expect(
      caso.ejecutar({ ...secretaria, rol: 'TESORERIA' }, 'periodo-1', { totalCupos: 5 }),
    ).rejects.toThrow(NoAutorizado)
  })

  it('no encuentra un período de otra institución', async () => {
    const { caso } = await armarMundo()

    await expect(
      caso.ejecutar({ ...secretaria, institucionId: 'institucion-2' }, 'periodo-1', {
        totalCupos: 5,
      }),
    ).rejects.toThrow(NoEncontrado)
  })

  it('no encuentra un período inexistente', async () => {
    const { caso } = await armarMundo()

    await expect(caso.ejecutar(secretaria, 'no-existe', { totalCupos: 5 })).rejects.toThrow(
      NoEncontrado,
    )
  })
})
