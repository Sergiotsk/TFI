import { describe, expect, it } from 'vitest'
import { Monto } from '../pago/monto'
import { CuposPorDebajoDeConfirmadas } from '../postulacion/errores'
import { PeriodoDeIngreso } from './periodo-de-ingreso'

function unPeriodo(cierraEl: Date): PeriodoDeIngreso {
  return new PeriodoDeIngreso(
    'periodo-1',
    'institucion-1',
    'Ingreso 2027',
    50,
    cierraEl,
    10,
    1_500_000,
  )
}

describe('PeriodoDeIngreso', () => {
  it('está abierto en el instante exacto del cierre', () => {
    const cierre = new Date('2026-12-01T00:00:00.000Z')

    expect(unPeriodo(cierre).estaAbierto(new Date('2026-12-01T00:00:00.000Z'))).toBe(true)
    expect(unPeriodo(cierre).estaAbierto(new Date('2026-12-01T00:00:00.001Z'))).toBe(false)
  })

  it('calcula el vencimiento sumando los días de plazo', () => {
    const ahora = new Date('2026-11-01T00:00:00.000Z')

    const vencimiento = unPeriodo(new Date('2026-12-01T00:00:00.000Z')).calcularVencimiento(ahora)

    expect(vencimiento).toEqual(new Date('2026-11-11T00:00:00.000Z'))
  })

  it('nunca pasa el vencimiento del cierre del período', () => {
    const ahora = new Date('2026-11-25T00:00:00.000Z')
    const cierre = new Date('2026-12-01T00:00:00.000Z')

    expect(unPeriodo(cierre).calcularVencimiento(ahora)).toEqual(cierre)
  })

  it('calcula los cupos libres descontando ocupados y pendientes vigentes', () => {
    expect(unPeriodo(new Date('2026-12-01T00:00:00.000Z')).cuposLibres(10, 5)).toBe(35)
  })

  it('puede quedar sin cupos libres', () => {
    expect(unPeriodo(new Date('2026-12-01T00:00:00.000Z')).cuposLibres(40, 10)).toBe(0)
  })

  it('expone el monto de matrícula como value object', () => {
    expect(unPeriodo(new Date('2026-12-01T00:00:00.000Z')).montoMatricula.centavos).toBe(1_500_000)
  })

  it('acepta cero cupos', () => {
    const periodo = new PeriodoDeIngreso(
      'periodo-1',
      'institucion-1',
      'Ingreso 2027',
      0,
      new Date('2026-12-01T00:00:00.000Z'),
      10,
      new Monto(1_500_000),
    )

    expect(periodo.totalCupos).toBe(0)
  })

  it('rechaza cupos negativos o decimales', () => {
    expect(() =>
      new PeriodoDeIngreso(
        'periodo-1',
        'institucion-1',
        'Ingreso 2027',
        -1,
        new Date('2026-12-01T00:00:00.000Z'),
        10,
        1_500_000,
      ),
    ).toThrow()
    expect(() =>
      new PeriodoDeIngreso(
        'periodo-1',
        'institucion-1',
        'Ingreso 2027',
        1.5,
        new Date('2026-12-01T00:00:00.000Z'),
        10,
        1_500_000,
      ),
    ).toThrow()
  })

  it('rechaza un plazo de pago inválido', () => {
    expect(() =>
      new PeriodoDeIngreso(
        'periodo-1',
        'institucion-1',
        'Ingreso 2027',
        50,
        new Date('2026-12-01T00:00:00.000Z'),
        0,
        1_500_000,
      ),
    ).toThrow()
  })

  it('rechaza un monto de matrícula inválido', () => {
    expect(() =>
      new PeriodoDeIngreso(
        'periodo-1',
        'institucion-1',
        'Ingreso 2027',
        50,
        new Date('2026-12-01T00:00:00.000Z'),
        10,
        0,
      ),
    ).toThrow()
  })

  it('cambia el total de cupos', () => {
    const periodo = unPeriodo(new Date('2026-12-01T00:00:00.000Z')).conTotalCupos(80, 50)

    expect(periodo.totalCupos).toBe(80)
    expect(periodo.montoMatriculaCentavos).toBe(1_500_000)
  })

  it('no permite bajar los cupos por debajo de las vacantes confirmadas', () => {
    expect(() =>
      unPeriodo(new Date('2026-12-01T00:00:00.000Z')).conTotalCupos(10, 11),
    ).toThrow(CuposPorDebajoDeConfirmadas)
  })
})
