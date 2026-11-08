import { describe, expect, test } from 'vitest'
import { GET } from './route'

describe('GET /api/health', () => {
  test('responde 200 con status ok', async () => {
    const respuesta = await GET()

    expect(respuesta.status).toBe(200)
    expect(await respuesta.json()).toMatchObject({ status: 'ok', service: 'TFI Web API' })
  })
})
