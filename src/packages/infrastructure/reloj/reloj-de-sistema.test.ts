import { describe, expect, it } from 'vitest'
import { probarContratoDeReloj } from '@tfi/application/contratos'
import { RelojDeSistema } from './reloj-de-sistema'

probarContratoDeReloj(() => new RelojDeSistema())

describe('RelojDeSistema', () => {
  it('devuelve la hora del sistema', () => {
    const antes = Date.now()

    const ahora = new RelojDeSistema().ahora().getTime()

    const despues = Date.now()
    expect(ahora).toBeGreaterThanOrEqual(antes)
    expect(ahora).toBeLessThanOrEqual(despues)
  })
})
