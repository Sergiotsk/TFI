import { describe, expect, it } from 'vitest'
import { GeneradorDeIdsFake } from '../puertos/generador-de-ids/fake'
import { RepositorioDePeriodosFake } from '../puertos/repositorio-de-periodos/fake'
import { RepositorioDePostulacionesFake } from '../puertos/repositorio-de-postulaciones/fake'
import type { Actor } from './actor'
import { CrearPeriodoUseCase } from './crear-periodo'
import { NoAutorizado } from './errores'

const CIERRE = new Date('2027-03-01T00:00:00.000Z')

const secretaria: Actor = {
  perfilId: 'perfil-secretaria',
  rol: 'SECRETARIA',
  institucionId: 'institucion-1',
}

const DATOS = {
  nombre: 'Primer cuatrimestre 2027',
  totalCupos: 50,
  cierraEl: CIERRE,
  diasPlazoPago: 3,
  montoMatriculaCentavos: 9_400_000,
}

function armarMundo() {
  const postulaciones = new RepositorioDePostulacionesFake()
  const periodos = new RepositorioDePeriodosFake(postulaciones)

  return {
    caso: new CrearPeriodoUseCase(periodos, new GeneradorDeIdsFake('periodo')),
    periodos,
  }
}

describe('CrearPeriodo', () => {
  it('crea el período en la institución del actor', async () => {
    const { caso, periodos } = armarMundo()

    const creado = await caso.ejecutar(secretaria, DATOS)

    expect(creado.id).toBe('periodo-1')
    expect(creado.institucionId).toBe('institucion-1')
    expect(creado.nombre).toBe(DATOS.nombre)
    expect(creado.totalCupos).toBe(50)
    expect(creado.cierraEl).toEqual(CIERRE)
    expect(await periodos.obtenerPorId(creado.id)).not.toBeNull()
  })

  it('también lo puede crear DIRECCION', async () => {
    const { caso } = armarMundo()

    await expect(caso.ejecutar({ ...secretaria, rol: 'DIRECCION' }, DATOS)).resolves.toBeDefined()
  })

  it('no lo pueden crear ASPIRANTE ni TESORERIA', async () => {
    const { caso } = armarMundo()

    await expect(caso.ejecutar({ ...secretaria, rol: 'ASPIRANTE' }, DATOS)).rejects.toThrow(
      NoAutorizado,
    )
    await expect(caso.ejecutar({ ...secretaria, rol: 'TESORERIA' }, DATOS)).rejects.toThrow(
      NoAutorizado,
    )
  })
})
