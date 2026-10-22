import { describe, expect, test } from 'vitest'
import { NumeroDePostulacion } from './numero-de-postulacion'

describe('NumeroDePostulacion', () => {
  test('expone el valor entero', () => {
    expect(new NumeroDePostulacion(42).valor).toBe(42)
  })

  test('formatear devuelve 6 dígitos con ceros a la izquierda', () => {
    expect(new NumeroDePostulacion(1).formatear()).toBe('000001')
    expect(new NumeroDePostulacion(42).formatear()).toBe('000042')
    expect(new NumeroDePostulacion(123456).formatear()).toBe('123456')
  })

  test('no recorta números de más de 6 dígitos', () => {
    expect(new NumeroDePostulacion(1234567).formatear()).toBe('1234567')
  })

  test('rechaza cero, negativos y decimales', () => {
    expect(() => new NumeroDePostulacion(0)).toThrow()
    expect(() => new NumeroDePostulacion(-3)).toThrow()
    expect(() => new NumeroDePostulacion(1.5)).toThrow()
  })

  test('igualA compara por valor', () => {
    expect(new NumeroDePostulacion(7).igualA(new NumeroDePostulacion(7))).toBe(true)
    expect(new NumeroDePostulacion(7).igualA(new NumeroDePostulacion(8))).toBe(false)
  })
})
