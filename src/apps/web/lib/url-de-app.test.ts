import { describe, expect, it } from 'vitest'
import { urlDeApp } from './url-de-app'

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
