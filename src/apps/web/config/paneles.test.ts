import { describe, expect, test } from 'vitest'
import type { Rol } from '@tfi/domain'
import { esRutaProtegida } from '../lib/rutas-protegidas'
import { PANEL_DE_ROL } from './paneles'

describe('PANEL_DE_ROL', () => {
  test.each<[Rol, string]>([
    ['ASPIRANTE', '/aspirante/postulacion'],
    ['TESORERIA', '/personal/pagos'],
    ['SECRETARIA', '/personal/periodos'],
    ['DIRECCION', '/direccion/casos'],
  ])('%s entra a %s (las rutas de tasks.md)', (rol, ruta) => {
    expect(PANEL_DE_ROL[rol]).toBe(ruta)
  })

  test('todos los paneles exigen sesión en el proxy', () => {
    for (const ruta of Object.values(PANEL_DE_ROL)) {
      expect(esRutaProtegida(ruta)).toBe(true)
    }
  })
})
