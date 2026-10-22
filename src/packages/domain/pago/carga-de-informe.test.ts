import { describe, expect, test } from 'vitest'
import { CargaDeInforme } from './carga-de-informe'

const cargadaEl = new Date('2027-02-04T20:00:00Z')
const resumen = { acreditados: 10, aDecidir: 2, noImputados: 3, duplicados: 1 }

describe('CargaDeInforme', () => {
  test('expone los datos y el resumen', () => {
    const carga = new CargaDeInforme('c-1', 'inst-1', 'tes-1', cargadaEl, 'informe.csv', resumen)

    expect(carga.id).toBe('c-1')
    expect(carga.institucionId).toBe('inst-1')
    expect(carga.cargadaPor).toBe('tes-1')
    expect(carga.cargadaEl).toBe(cargadaEl)
    expect(carga.nombreArchivo).toBe('informe.csv')
    expect(carga.resumen).toEqual(resumen)
  })

  test('una carga recién iniciada tiene el resumen en cero', () => {
    const carga = CargaDeInforme.iniciar('c-1', 'inst-1', 'tes-1', cargadaEl, 'informe.csv')

    expect(carga.resumen).toEqual({ acreditados: 0, aDecidir: 0, noImputados: 0, duplicados: 0 })
  })

  test('rechaza contadores negativos o decimales', () => {
    expect(() => new CargaDeInforme('c-1', 'inst-1', 'tes-1', cargadaEl, 'a.csv', { ...resumen, duplicados: -1 })).toThrow()
    expect(() => new CargaDeInforme('c-1', 'inst-1', 'tes-1', cargadaEl, 'a.csv', { ...resumen, acreditados: 1.5 })).toThrow()
  })

  test('conResumen devuelve una carga nueva con el resumen cerrado', () => {
    const inicial = CargaDeInforme.iniciar('c-1', 'inst-1', 'tes-1', cargadaEl, 'informe.csv')
    const cerrada = inicial.conResumen(resumen)

    expect(cerrada.resumen).toEqual(resumen)
    expect(inicial.resumen.acreditados).toBe(0)
  })
})
