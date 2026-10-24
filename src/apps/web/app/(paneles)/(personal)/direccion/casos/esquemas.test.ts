import { describe, expect, test } from 'vitest'
import { avisoDeDecision } from './esquemas'

describe('avisoDeDecision', () => {
  test('aceptar avisa que la vacante quedó confirmada', () => {
    expect(avisoDeDecision({ decision: 'ACEPTAR', numero: '000561' })).toBe(
      'Pago de la Postulación Nº 000561 aceptado: la vacante quedó confirmada.',
    )
  })

  test('rechazar avisa que Tesorería tiene que devolver la matrícula', () => {
    expect(avisoDeDecision({ decision: 'RECHAZAR', numero: '000558' })).toBe(
      'Pago de la Postulación Nº 000558 rechazado: Tesorería tiene que devolver la matrícula.',
    )
  })

  test.each([
    {},
    { decision: 'ACEPTAR' },
    { decision: 'QUIZAS', numero: '000561' },
    { decision: 'ACEPTAR', numero: '<script>' },
    { decision: ['ACEPTAR', 'RECHAZAR'], numero: '000561' },
  ])('sin parámetros válidos no hay aviso: %o', (parametros) => {
    expect(avisoDeDecision(parametros)).toBeNull()
  })
})
