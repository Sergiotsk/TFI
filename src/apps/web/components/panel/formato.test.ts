import { describe, expect, test } from 'vitest'
import { describirVencimiento, iniciales, porcentaje } from './formato'

describe('describirVencimiento', () => {
  // Mediodía del 28/10/2026 en Buenos Aires (UTC-3).
  const ahora = new Date('2026-10-28T15:00:00Z')

  test.each<[string, string, string]>([
    ['2026-10-28T23:00:00Z', 'vence hoy', 'proximo'],
    ['2026-10-29T15:00:00Z', 'vence mañana', 'proximo'],
    ['2026-10-30T15:00:00Z', 'en 2 días', 'normal'],
    ['2026-10-28T12:00:00Z', 'venció hoy', 'vencido'],
    ['2026-10-27T15:00:00Z', 'venció ayer', 'vencido'],
    ['2026-10-26T15:00:00Z', 'hace 2 días', 'vencido'],
  ])('%s → %s (%s)', (venceEl, texto, urgencia) => {
    expect(describirVencimiento(new Date(venceEl), ahora)).toEqual({
      texto,
      urgencia,
    })
  })

  test('cuenta los días en la hora de Buenos Aires, no en UTC', () => {
    // 01:00 UTC del 29 todavía es el 28 a las 22:00 en Buenos Aires.
    expect(describirVencimiento(new Date('2026-10-29T01:00:00Z'), ahora).texto).toBe('vence hoy')
  })
})

describe('iniciales', () => {
  test.each([
    ['Sofía Secretaria', 'SS'],
    ['diego', 'D'],
    ['  Ana  María López ', 'AM'],
    ['', '?'],
  ])('%j → %s', (nombre, esperado) => {
    expect(iniciales(nombre)).toBe(esperado)
  })
})

describe('porcentaje', () => {
  test('redondea a entero', () => {
    expect(porcentaje(1, 3)).toBe(33)
  })

  test('sin total es 0, no NaN', () => {
    expect(porcentaje(0, 0)).toBe(0)
  })

  test('no pasa de 100 aunque haya excedente', () => {
    expect(porcentaje(52, 50)).toBe(100)
  })
})
