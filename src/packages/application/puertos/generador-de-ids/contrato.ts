import { describe, expect, it } from 'vitest'
import type { GeneradorDeIds } from './puerto'

/**
 * Contrato de `GeneradorDeIds`. Corre contra el fake y contra el generador real
 * de infrastructure.
 */
export function probarContratoDeGeneradorDeIds(crearGenerador: () => GeneradorDeIds) {
  describe('contrato: GeneradorDeIds', () => {
    it('devuelve ids no vacíos', () => {
      expect(crearGenerador().nuevo()).not.toBe('')
    })

    it('no repite ids', () => {
      const generador = crearGenerador()
      const ids = new Set(Array.from({ length: 100 }, () => generador.nuevo()))

      expect(ids.size).toBe(100)
    })
  })
}
