import { describe, expect, test } from 'vitest'
import { Monto } from '../pago/monto'
import { CuposPorDebajoDeConfirmadas } from '../postulacion/errores'
import { PeriodoDeIngreso } from './periodo-de-ingreso'

const DIA = 24 * 60 * 60 * 1000

function periodo(
  sobrescribir: { totalCupos?: number; cierraEl?: Date; diasPlazoPago?: number; montoMatricula?: Monto } = {},
) {
  return new PeriodoDeIngreso(
    'per-1',
    'inst-1',
    'Ingreso 2027',
    sobrescribir.totalCupos ?? 50,
    sobrescribir.cierraEl ?? new Date('2027-03-01T00:00:00Z'),
    sobrescribir.diasPlazoPago ?? 5,
    sobrescribir.montoMatricula ?? new Monto(1500000),
  )
}

describe('PeriodoDeIngreso', () => {
  test('expone los datos con los que se construyó', () => {
    const p = periodo()

    expect(p.id).toBe('per-1')
    expect(p.institucionId).toBe('inst-1')
    expect(p.nombre).toBe('Ingreso 2027')
    expect(p.totalCupos).toBe(50)
    expect(p.diasPlazoPago).toBe(5)
    expect(p.montoMatricula.centavos).toBe(1500000)
  })

  test('acepta cero cupos', () => {
    expect(periodo({ totalCupos: 0 }).totalCupos).toBe(0)
  })

  test('rechaza cupos negativos o decimales', () => {
    expect(() => periodo({ totalCupos: -1 })).toThrow()
    expect(() => periodo({ totalCupos: 1.5 })).toThrow()
  })

  test('rechaza un plazo de pago menor a 1 día o decimal', () => {
    expect(() => periodo({ diasPlazoPago: 0 })).toThrow()
    expect(() => periodo({ diasPlazoPago: -2 })).toThrow()
    expect(() => periodo({ diasPlazoPago: 2.5 })).toThrow()
  })

  test('rechaza una matrícula de 0 centavos (CHECK monto_matricula_centavos > 0)', () => {
    expect(() => periodo({ montoMatricula: new Monto(0) })).toThrow()
    expect(periodo({ montoMatricula: new Monto(1) }).montoMatricula.centavos).toBe(1)
  })

  describe('estaAbierto', () => {
    const cierre = new Date('2027-03-01T00:00:00Z')

    test('está abierto antes del cierre', () => {
      expect(periodo({ cierraEl: cierre }).estaAbierto(new Date('2027-02-28T23:59:59Z'))).toBe(true)
    })

    test('está abierto justo en el instante de cierre (ahora <= cierraEl)', () => {
      expect(periodo({ cierraEl: cierre }).estaAbierto(new Date(cierre))).toBe(true)
    })

    test('está cerrado después del cierre', () => {
      expect(periodo({ cierraEl: cierre }).estaAbierto(new Date(cierre.getTime() + 1))).toBe(false)
    })
  })

  describe('calcularVencimiento', () => {
    test('es ahora + diasPlazoPago cuando cae antes del cierre', () => {
      const ahora = new Date('2027-02-01T10:00:00Z')

      expect(periodo({ diasPlazoPago: 5 }).calcularVencimiento(ahora)).toEqual(new Date(ahora.getTime() + 5 * DIA))
    })

    test('se topa en cierraEl cuando ahora + plazo lo supera', () => {
      const cierre = new Date('2027-03-01T00:00:00Z')
      const p = periodo({ cierraEl: cierre, diasPlazoPago: 5 })

      expect(p.calcularVencimiento(new Date('2027-02-27T00:00:00Z'))).toEqual(cierre)
    })

    test('si ahora + plazo coincide con cierraEl, devuelve cierraEl', () => {
      const cierre = new Date('2027-03-01T00:00:00Z')
      const p = periodo({ cierraEl: cierre, diasPlazoPago: 5 })

      expect(p.calcularVencimiento(new Date(cierre.getTime() - 5 * DIA))).toEqual(cierre)
    })

    test('devuelve una fecha nueva, no la instancia interna', () => {
      const p = periodo()
      const vencimiento = p.calcularVencimiento(new Date('2027-03-02T00:00:00Z'))

      vencimiento.setTime(0)

      expect(p.cierraEl.getTime()).not.toBe(0)
    })
  })

  describe('conTotalCupos', () => {
    test('devuelve un período nuevo con el total modificado', () => {
      const original = periodo({ totalCupos: 50 })
      const nuevo = original.conTotalCupos(60, 10)

      expect(nuevo.totalCupos).toBe(60)
      expect(original.totalCupos).toBe(50)
    })

    test('permite bajar hasta igualar las vacantes confirmadas', () => {
      expect(periodo({ totalCupos: 50 }).conTotalCupos(10, 10).totalCupos).toBe(10)
    })

    test('rechaza bajar por debajo de las vacantes confirmadas', () => {
      expect(() => periodo({ totalCupos: 50 }).conTotalCupos(9, 10)).toThrow(CuposPorDebajoDeConfirmadas)
    })
  })
})
