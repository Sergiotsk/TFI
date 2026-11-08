import { describe, expect, it } from 'vitest'
import type { Reloj } from './puerto'

/**
 * Contrato de `Reloj`. Corre contra el fake y contra `RelojDeSistema`
 * (infrastructure): el fake tiene que comportarse como un reloj de verdad.
 */
export function probarContratoDeReloj(crearReloj: () => Reloj) {
  describe('contrato: Reloj', () => {
    it('ahora() devuelve una fecha válida', () => {
      expect(Number.isNaN(crearReloj().ahora().getTime())).toBe(false)
    })

    it('dos llamadas seguidas no retroceden', () => {
      const reloj = crearReloj()

      const primera = reloj.ahora()
      const segunda = reloj.ahora()

      expect(segunda.getTime()).toBeGreaterThanOrEqual(primera.getTime())
    })
  })
}
