import { describe, expect, it } from 'vitest'
import { GeneradorDeIdsFake } from '../puertos/generador-de-ids/fake'
import { RelojFijo } from '../puertos/reloj/fake'
import { RepositorioDePeriodosFake } from '../puertos/repositorio-de-periodos/fake'
import { RepositorioDePostulacionesFake } from '../puertos/repositorio-de-postulaciones/fake'
import type { Actor } from './actor'
import { CrearPeriodoUseCase } from './crear-periodo'
import { NoAutorizado } from './errores'

const AHORA = new Date('2026-10-20T00:00:00.000Z')
const CIERRE = new Date('2027-03-01T00:00:00.000Z')

const director: Actor = {
  perfilId: 'perfil-director',
  rol: 'DIRECCION',
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
    caso: new CrearPeriodoUseCase(periodos, new GeneradorDeIdsFake('periodo'), new RelojFijo(AHORA)),
    periodos,
  }
}

describe('CrearPeriodo', () => {
  it('crea el período en la institución del actor', async () => {
    const { caso, periodos } = armarMundo()

    const creado = await caso.ejecutar(director, DATOS)

    expect(creado.id).toBe('periodo-1')
    expect(creado.institucionId).toBe('institucion-1')
    expect(creado.nombre).toBe(DATOS.nombre)
    expect(creado.totalCupos).toBe(50)
    expect(creado.cierraEl).toEqual(CIERRE)
    expect(await periodos.obtenerPorId(creado.id)).not.toBeNull()
  })

  it('solo lo puede crear DIRECCION', async () => {
    const { caso } = armarMundo()

    for (const rol of ['ASPIRANTE', 'SECRETARIA', 'TESORERIA'] as const) {
      await expect(caso.ejecutar({ ...director, rol }, DATOS)).rejects.toThrow(NoAutorizado)
    }
  })
})
