import { describe, expect, it } from 'vitest'
import { NumeroDePostulacion } from './numero-de-postulacion'

describe('NumeroDePostulacion', () => {
  it('formatea con seis dígitos', () => {
    expect(NumeroDePostulacion.desde(1).formatear()).toBe('000001')
    expect(NumeroDePostulacion.desde(123456).formatear()).toBe('123456')
  })

  it('no recorta los números más largos que seis dígitos', () => {
    expect(NumeroDePostulacion.desde(1234567).formatear()).toBe('1234567')
  })

  it.each([0, -1, 1.5, Number.NaN])('rechaza %s', (valor) => {
    expect(() => NumeroDePostulacion.desde(valor)).toThrow()
  })

  it('compara por valor', () => {
    expect(NumeroDePostulacion.desde(7).equals(NumeroDePostulacion.desde(7))).toBe(true)
    expect(NumeroDePostulacion.desde(7).equals(NumeroDePostulacion.desde(8))).toBe(false)
  })
})
