import { describe, expect, test } from 'vitest'
import { Monto } from './monto'

describe('Monto', () => {
  test('guarda los centavos enteros con los que se construyó', () => {
    expect(new Monto(1500000).centavos).toBe(1500000)
  })

  test('acepta el cero', () => {
    expect(new Monto(0).centavos).toBe(0)
  })

  test('rechaza montos negativos', () => {
    expect(() => new Monto(-1)).toThrow()
  })

  test('rechaza montos con decimales (no hay float en ningún punto)', () => {
    expect(() => new Monto(10.5)).toThrow()
  })

  test('rechaza valores que no son números finitos', () => {
    expect(() => new Monto(Number.NaN)).toThrow()
    expect(() => new Monto(Number.POSITIVE_INFINITY)).toThrow()
  })

  describe('cubre', () => {
    test('cubre un monto menor', () => {
      expect(new Monto(2000).cubre(new Monto(1500))).toBe(true)
    })

    test('cubre un monto igual', () => {
      expect(new Monto(1500).cubre(new Monto(1500))).toBe(true)
    })

    test('no cubre un monto mayor', () => {
      expect(new Monto(1499).cubre(new Monto(1500))).toBe(false)
    })
  })

  test('igualA compara por valor', () => {
    expect(new Monto(100).igualA(new Monto(100))).toBe(true)
    expect(new Monto(100).igualA(new Monto(101))).toBe(false)
  })
})
