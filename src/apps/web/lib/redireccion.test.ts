import { describe, expect, it } from 'vitest'
import { destinoSeguro, redireccionValida } from './redireccion'

describe('redireccionValida', () => {
  it.each(['/', '/panel', '/personal/pagos?pagina=2#lista', '/%5Cevil.com'])(
    'acepta el destino interno %j',
    (destino) => {
      expect(redireccionValida(destino)).toBe(true)
    },
  )

  it.each([
    null,
    undefined,
    '',
    'panel',
    'https://evil.com',
    'javascript:alert(1)',
    '//evil.com',
    '/\\evil.com',
    '\\\\evil.com',
    '/\\/evil.com',
    '/\t/evil.com',
    '/\n/evil.com',
    '/\r/evil.com',
  ])('rechaza el destino %j', (destino) => {
    expect(redireccionValida(destino)).toBe(false)
  })
})

describe('destinoSeguro', () => {
  it('usa el destino si es interno', () => {
    expect(destinoSeguro('/personal/pagos', '/panel')).toBe('/personal/pagos')
  })

  it('cae en el valor por defecto si intenta salir del sitio', () => {
    expect(destinoSeguro('/\\evil.com', '/panel')).toBe('/panel')
  })
})
