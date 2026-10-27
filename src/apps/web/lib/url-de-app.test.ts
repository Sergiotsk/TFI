import { afterEach, describe, expect, it } from 'vitest'
import { urlBaseDeLaApp, urlDeApp } from './url-de-app'

describe('urlDeApp', () => {
  it('no duplica la barra cuando la base termina con barra', () => {
    expect(urlDeApp('https://example.com/', '/api/pagos/webhook/mercadopago')).toBe(
      'https://example.com/api/pagos/webhook/mercadopago',
    )
  })

  it('agrega la barra cuando la base no la tiene', () => {
    expect(urlDeApp('https://example.com', 'api/pagos/webhook/mercadopago')).toBe(
      'https://example.com/api/pagos/webhook/mercadopago',
    )
  })

  it('conserva la ruta base y el query string', () => {
    expect(urlDeApp('https://example.com/app/', '/pagos/retorno?resultado=success')).toBe(
      'https://example.com/app/pagos/retorno?resultado=success',
    )
  })

  it('tolera varias barras finales', () => {
    expect(urlDeApp('https://example.com///', 'pagos/retorno')).toBe(
      'https://example.com/pagos/retorno',
    )
  })
})

describe('urlBaseDeLaApp', () => {
  const original = process.env.NEXT_PUBLIC_APP_URL

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL
    } else {
      process.env.NEXT_PUBLIC_APP_URL = original
    }
  })

  it('usa NEXT_PUBLIC_APP_URL sin la barra final', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://tfi.example.com/'
    expect(urlBaseDeLaApp()).toBe('https://tfi.example.com')
  })

  it('cae a localhost cuando no está configurada', () => {
    delete process.env.NEXT_PUBLIC_APP_URL
    expect(urlBaseDeLaApp()).toBe('http://localhost:3000')
  })
})
