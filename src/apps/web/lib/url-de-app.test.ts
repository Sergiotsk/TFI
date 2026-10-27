import { afterEach, describe, expect, it } from 'vitest'
import { urlBaseDeLaApp } from './url-de-app'

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

  it('tolera varias barras finales', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://tfi.example.com///'
    expect(urlBaseDeLaApp()).toBe('https://tfi.example.com')
  })

  it('cae a localhost cuando no está configurada', () => {
    delete process.env.NEXT_PUBLIC_APP_URL
    expect(urlBaseDeLaApp()).toBe('http://localhost:3000')
  })
})
