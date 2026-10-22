import { describe, expect, test } from 'vitest'
import { DecisionDeDireccion } from './decision-de-direccion'

describe('DecisionDeDireccion', () => {
  test('expone los datos de la decisión', () => {
    const decididaEl = new Date('2027-02-10T12:00:00Z')
    const decision = new DecisionDeDireccion('d-1', 'pg-1', 'ACEPTAR', 'dir-1', decididaEl, 'Caso especial')

    expect(decision.id).toBe('d-1')
    expect(decision.pagoId).toBe('pg-1')
    expect(decision.decision).toBe('ACEPTAR')
    expect(decision.decididaPor).toBe('dir-1')
    expect(decision.decididaEl).toBe(decididaEl)
    expect(decision.comentario).toBe('Caso especial')
  })

  test('el comentario es opcional', () => {
    expect(new DecisionDeDireccion('d-1', 'pg-1', 'RECHAZAR', 'dir-1', new Date()).comentario).toBeUndefined()
  })
})
