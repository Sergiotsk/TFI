import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  esUrlLocal,
  hayEntornoDePrueba,
  hayEntornoDePruebaConServicio,
  urlDePrueba,
} from './entorno-de-prueba'

const REMOTA = 'https://proyecto.supabase.co'
const LOCAL = 'http://127.0.0.1:54321'

function conEntorno(url: string) {
  vi.stubEnv('SUPABASE_TEST_URL', url)
  vi.stubEnv('SUPABASE_TEST_PUBLISHABLE_KEY', 'clave-publica')
  vi.stubEnv('SUPABASE_TEST_SERVICE_ROLE_KEY', 'clave-de-servicio')
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('esUrlLocal', () => {
  it.each([LOCAL, 'http://localhost:54321', 'http://[::1]:54321'])('acepta %s', (url) => {
    expect(esUrlLocal(url)).toBe(true)
  })

  it.each([
    REMOTA,
    'https://www.sistemagiu.com.ar',
    'http://127.0.0.1.evil.com:54321',
    'http://localhost.evil.com',
    'http://localhost@evil.com',
    'no-es-una-url',
  ])('rechaza %s', (url) => {
    expect(esUrlLocal(url)).toBe(false)
  })
})

describe('el freno contra un Supabase remoto', () => {
  it('sin variables, los contratos se siguen saltando', () => {
    vi.stubEnv('SUPABASE_TEST_URL', '')
    vi.stubEnv('SUPABASE_TEST_PUBLISHABLE_KEY', '')

    expect(hayEntornoDePrueba()).toBe(false)
  })

  it('con una URL local, habilita los contratos', () => {
    conEntorno(LOCAL)

    expect(hayEntornoDePrueba()).toBe(true)
    expect(hayEntornoDePruebaConServicio()).toBe(true)
    expect(urlDePrueba()).toBe(LOCAL)
  })

  it('con una URL remota, falla en vez de saltarse o de correr', () => {
    conEntorno(REMOTA)

    expect(() => hayEntornoDePrueba()).toThrow(/local/)
    expect(() => hayEntornoDePruebaConServicio()).toThrow(/local/)
    expect(() => urlDePrueba()).toThrow(/local/)
  })
})
