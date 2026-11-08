import { describe, expect, test } from 'vitest'
import { esRutaProtegida } from './rutas-protegidas'

describe('esRutaProtegida', () => {
  test.each(['/panel', '/aspirante', '/personal', '/direccion'])('%s exige sesión', (ruta) => {
    expect(esRutaProtegida(ruta)).toBe(true)
  })

  test.each([
    '/panel/algo',
    '/aspirante/postulacion',
    '/personal/pagos',
    '/personal/periodos',
    '/direccion/casos',
  ])('%s exige sesión (subruta de un panel)', (ruta) => {
    expect(esRutaProtegida(ruta)).toBe(true)
  })

  test.each(['/', '/login', '/registro', '/api/health'])('%s es pública', (ruta) => {
    expect(esRutaProtegida(ruta)).toBe(false)
  })

  test.each(['/panelito', '/personalizado', '/aspirantes', '/direcciones'])(
    '%s no se protege por compartir el comienzo (el prefijo corta en un segmento)',
    (ruta) => {
      expect(esRutaProtegida(ruta)).toBe(false)
    },
  )
})
