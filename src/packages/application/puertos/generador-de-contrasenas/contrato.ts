import { describe, expect, it } from 'vitest'
import {
  LONGITUD_MAXIMA_DE_CONTRASENA,
  LONGITUD_MINIMA_DE_CONTRASENA,
} from '../../casos-de-uso/autenticacion/politica-de-contrasena'
import type { GeneradorDeContrasenas } from './puerto'

/**
 * Contrato de `GeneradorDeContrasenas`. Corre contra el fake y contra el
 * generador real de infrastructure.
 */
export function probarContratoDeGeneradorDeContrasenas(
  crearGenerador: () => GeneradorDeContrasenas,
) {
  describe('contrato: GeneradorDeContrasenas', () => {
    it('genera una contraseña dentro de la política', () => {
      const contrasena = crearGenerador().temporal()

      expect(contrasena.length).toBeGreaterThanOrEqual(LONGITUD_MINIMA_DE_CONTRASENA)
      expect(contrasena.length).toBeLessThanOrEqual(LONGITUD_MAXIMA_DE_CONTRASENA)
    })

    it('no repite contraseñas', () => {
      const generador = crearGenerador()
      const contrasenas = new Set(Array.from({ length: 100 }, () => generador.temporal()))

      expect(contrasenas.size).toBe(100)
    })
  })
}
