import { describe, expect, test } from 'vitest'
import type { Rol } from '@tfi/domain'
import { esRutaProtegida } from '../lib/rutas-protegidas'
import { MENU_DE_ROL, PANEL_DE_ROL, type ItemDeMenu, type RolDelPersonal } from './paneles'

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

describe('MENU_DE_ROL', () => {
  // Según quién puede usar cada pantalla en contracts/api-http.md y puertos.md (ListarBandeja): la bandeja de pagos
  // es de Tesorería y Secretaría, los períodos de Secretaría y Dirección, y los casos A_DECIDIR solo de Dirección.
  // Las postulaciones (buscar, acreditar pago, prorrogar plazo) las operan los tres roles del personal (ADR 0009).
  // Los pagos se parten por tarea: importar el informe, resolver los no imputados y hacer las devoluciones.
  test.each<[RolDelPersonal, string[]]>([
    [
      'TESORERIA',
      [
        '/personal/pagos',
        '/personal/pagos/no-imputados',
        '/personal/pagos/devoluciones',
        '/personal/postulaciones',
      ],
    ],
    [
      'SECRETARIA',
      [
        '/personal/periodos',
        '/personal/postulaciones',
        '/personal/pagos',
        '/personal/pagos/no-imputados',
        '/personal/pagos/devoluciones',
      ],
    ],
    ['DIRECCION', ['/direccion/casos', '/personal/periodos', '/personal/postulaciones']],
  ])('%s ve %j', (rol, rutas) => {
    expect(MENU_DE_ROL[rol].map((item) => item.href)).toEqual(rutas)
  })

  test('las bandejas de pagos muestran cuántos quedan pendientes', () => {
    const contadores = MENU_DE_ROL.TESORERIA.map((item) => [item.href, item.contador])

    expect(contadores).toContainEqual(['/personal/pagos/no-imputados', 'NO_IMPUTADO'])
    expect(contadores).toContainEqual(['/personal/pagos/devoluciones', 'DEVUELTO'])
  })

  test('los casos de Dirección muestran cuántos quedan por decidir', () => {
    const contadores = MENU_DE_ROL.DIRECCION.map((item) => [item.href, item.contador])

    expect(contadores).toContainEqual(['/direccion/casos', 'A_DECIDIR'])
  })

  test('el aspirante no tiene menú: su panel es un recorrido lineal, sin barra lateral', () => {
    expect(Object.keys(MENU_DE_ROL)).not.toContain('ASPIRANTE')
  })

  test('el primer ítem de cada menú es el panel al que lo manda /panel', () => {
    for (const [rol, items] of Object.entries(MENU_DE_ROL) as [RolDelPersonal, readonly ItemDeMenu[]][]) {
      expect(items[0]?.href).toBe(PANEL_DE_ROL[rol])
    }
  })

  test('todos los ítems exigen sesión en el proxy', () => {
    for (const items of Object.values(MENU_DE_ROL)) {
      for (const item of items) {
        expect(esRutaProtegida(item.href)).toBe(true)
      }
    }
  })
})
