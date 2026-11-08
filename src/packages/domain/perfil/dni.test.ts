import { describe, expect, test } from 'vitest'
import { Dni } from './dni'

describe('Dni', () => {
  test('acepta 8 dígitos', () => {
    expect(new Dni('12345678').valor).toBe('12345678')
  })

  test('acepta 7 dígitos', () => {
    expect(new Dni('1234567').valor).toBe('1234567')
  })

  test('rechaza menos de 7 dígitos', () => {
    expect(() => new Dni('123456')).toThrow()
  })

  test('rechaza más de 8 dígitos', () => {
    expect(() => new Dni('123456789')).toThrow()
  })

  test('rechaza caracteres que no son dígitos (la normalización se hace en el borde)', () => {
    expect(() => new Dni('12.345.678')).toThrow()
    expect(() => new Dni('1234567a')).toThrow()
    expect(() => new Dni(' 12345678')).toThrow()
  })

  test('rechaza el vacío', () => {
    expect(() => new Dni('')).toThrow()
  })

  test('igualA compara por valor', () => {
    expect(new Dni('12345678').igualA(new Dni('12345678'))).toBe(true)
    expect(new Dni('12345678').igualA(new Dni('12345679'))).toBe(false)
  })
})
