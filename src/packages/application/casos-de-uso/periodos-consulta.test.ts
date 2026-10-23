import { describe, expect, it } from 'vitest'
import { PeriodoDeIngreso, PeriodoDuplicado, PeriodoInvalido } from '@tfi/domain'
import type { Actor } from './actor'
import { ConsultarOcupacionUseCase } from './consultar-ocupacion'
import { ConsultarPeriodoUseCase } from './consultar-periodo'
import { CrearPeriodoUseCase } from './crear-periodo'
import { NoAutorizado, NoEncontrado } from './errores'
import { ListarPeriodosTodosUseCase } from './listar-periodos-todos'
import { ModificarPeriodoUseCase } from './modificar-periodo'
import { GeneradorDeIdsFake } from '../puertos/generador-de-ids/fake'
import { RelojFijo } from '../puertos/reloj/fake'
import { RepositorioDePeriodosFake } from '../puertos/repositorio-de-periodos/fake'
import { RepositorioDePostulacionesFake } from '../puertos/repositorio-de-postulaciones/fake'

const AHORA = new Date('2026-10-20T00:00:00.000Z')
const INSTITUCION = 'institucion-1'
const OTRA_INSTITUCION = 'institucion-2'

const director: Actor = {
  perfilId: 'director-1',
  rol: 'DIRECCION',
  institucionId: INSTITUCION,
}

const secretaria: Actor = {
  perfilId: 'secretaria-1',
  rol: 'SECRETARIA',
  institucionId: INSTITUCION,
}

const aspirante: Actor = {
  perfilId: 'aspirante-1',
  rol: 'ASPIRANTE',
  institucionId: INSTITUCION,
}

function periodo(
  id: string,
  nombre: string,
  cierraEl: Date,
  institucionId = INSTITUCION,
): PeriodoDeIngreso {
  return new PeriodoDeIngreso(id, institucionId, nombre, 10, cierraEl, 3, 9_400_000)
}

function armar() {
  const postulaciones = new RepositorioDePostulacionesFake()
  const periodos = new RepositorioDePeriodosFake(postulaciones)
  const reloj = new RelojFijo(AHORA)

  return {
    postulaciones,
    periodos,
    reloj,
    listarTodos: new ListarPeriodosTodosUseCase(periodos),
    consultar: new ConsultarPeriodoUseCase(periodos),
    ocupacion: new ConsultarOcupacionUseCase(periodos, reloj),
    crear: new CrearPeriodoUseCase(periodos, new GeneradorDeIdsFake('periodo'), reloj),
    modificar: new ModificarPeriodoUseCase(periodos, reloj),
  }
}

describe('ListarPeriodosTodos', () => {
  it('incluye los cerrados y pagina, solo para el personal', async () => {
    const { periodos, listarTodos } = armar()
    await periodos.guardar(periodo('abierto', 'Abierto', new Date('2027-03-01T00:00:00.000Z')))
    await periodos.guardar(periodo('cerrado', 'Cerrado', new Date('2026-01-01T00:00:00.000Z')))
    await periodos.guardar(
      periodo('ajeno', 'Ajeno', new Date('2027-04-01T00:00:00.000Z'), OTRA_INSTITUCION),
    )

    const pagina = await listarTodos.ejecutar(secretaria, { pagina: 1, porPagina: 20 })

    expect(pagina.total).toBe(2)
    expect(pagina.items.map((p) => p.id)).toEqual(['abierto', 'cerrado'])
    await expect(
      listarTodos.ejecutar(aspirante, { pagina: 1, porPagina: 20 }),
    ).rejects.toThrow(NoAutorizado)
  })
})

describe('ConsultarPeriodo', () => {
  it('devuelve el período de la institución del actor', async () => {
    const { periodos, consultar } = armar()
    await periodos.guardar(periodo('periodo-1', 'Primero', new Date('2027-03-01T00:00:00.000Z')))

    const encontrado = await consultar.ejecutar(aspirante, 'periodo-1')
    expect(encontrado.id).toBe('periodo-1')
  })

  it('un período de otra institución se comporta como inexistente', async () => {
    const { periodos, consultar } = armar()
    await periodos.guardar(
      periodo('ajeno', 'Ajeno', new Date('2027-03-01T00:00:00.000Z'), OTRA_INSTITUCION),
    )

    await expect(consultar.ejecutar(aspirante, 'ajeno')).rejects.toThrow(NoEncontrado)
  })
})

describe('ConsultarOcupacion', () => {
  it('suma confirmadas y pendientes vigentes, y calcula los libres', async () => {
    const { periodos, postulaciones, ocupacion } = armar()
    await periodos.guardar(periodo('periodo-1', 'Primero', new Date('2027-03-01T00:00:00.000Z')))

    postulaciones.sembrar({
      aspiranteId: 'aspirante-1',
      periodoId: 'periodo-1',
      estado: 'VACANTE_CONFIRMADA',
    })
    postulaciones.sembrar({
      aspiranteId: 'aspirante-2',
      periodoId: 'periodo-1',
      estado: 'PAGO_PENDIENTE',
      venceEl: new Date('2026-10-25T00:00:00.000Z'),
    })
    postulaciones.sembrar({
      aspiranteId: 'aspirante-3',
      periodoId: 'periodo-1',
      estado: 'PAGO_PENDIENTE',
      venceEl: new Date('2026-10-10T00:00:00.000Z'),
    })

    const resultado = await ocupacion.ejecutar(secretaria, 'periodo-1')

    expect(resultado.totalCupos).toBe(10)
    expect(resultado.ocupados).toBe(1)
    expect(resultado.pendientesVigentes).toBe(1)
    expect(resultado.libres).toBe(8)
    expect(resultado.nombre).toBe('Primero')
  })

  it('muestra el exceso cuando las confirmadas superan los cupos', async () => {
    const { periodos, postulaciones, ocupacion } = armar()
    await periodos.guardar(
      new PeriodoDeIngreso(
        'periodo-chico',
        INSTITUCION,
        'Chico',
        2,
        new Date('2027-03-01T00:00:00.000Z'),
        3,
        1_000,
      ),
    )

    for (const indice of [1, 2, 3]) {
      postulaciones.sembrar({
        aspiranteId: `aspirante-${indice}`,
        periodoId: 'periodo-chico',
        estado: 'VACANTE_CONFIRMADA',
      })
    }

    const resultado = await ocupacion.ejecutar(secretaria, 'periodo-chico')

    expect(resultado.totalCupos).toBe(2)
    expect(resultado.ocupados).toBe(3)
    expect(resultado.libres).toBe(-1)
  })

  it('un aspirante no puede ver la ocupación', async () => {
    const { periodos, ocupacion } = armar()
    await periodos.guardar(periodo('periodo-1', 'Primero', new Date('2027-03-01T00:00:00.000Z')))

    await expect(ocupacion.ejecutar(aspirante, 'periodo-1')).rejects.toThrow(NoAutorizado)
  })
})

describe('Crear y modificar períodos', () => {
  it('no deja crear un período que nace cerrado', async () => {
    const { crear } = armar()

    await expect(
      crear.ejecutar(director, {
        nombre: 'Pasado',
        totalCupos: 10,
        cierraEl: new Date('2026-01-01T00:00:00.000Z'),
        diasPlazoPago: 3,
        montoMatriculaCentavos: 9_400_000,
      }),
    ).rejects.toThrow(PeriodoInvalido)
  })

  it('no deja repetir el nombre dentro de la institución', async () => {
    const { crear } = armar()
    const datos = {
      nombre: 'Primero',
      totalCupos: 10,
      cierraEl: new Date('2027-03-01T00:00:00.000Z'),
      diasPlazoPago: 3,
      montoMatriculaCentavos: 9_400_000,
    }

    await crear.ejecutar(director, datos)
    await expect(crear.ejecutar(director, datos)).rejects.toThrow(PeriodoDuplicado)
  })

  it('no deja mover el cierre de un período activo al pasado', async () => {
    const { periodos, modificar } = armar()
    await periodos.guardar(periodo('periodo-1', 'Primero', new Date('2027-03-01T00:00:00.000Z')))

    await expect(
      modificar.ejecutar(director, 'periodo-1', {
        cierraEl: new Date('2026-01-01T00:00:00.000Z'),
      }),
    ).rejects.toThrow(PeriodoInvalido)
  })
})
