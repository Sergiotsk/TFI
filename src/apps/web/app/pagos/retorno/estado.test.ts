import { describe, expect, it } from 'vitest'
import { resolverEstadoDeRetorno } from './estado'

describe('resolverEstadoDeRetorno', () => {
  it('prioriza el resultado propio de la app', () => {
    expect(
      resolverEstadoDeRetorno({ resultado: 'success', status: 'rejected' }),
    ).toBe('success')
  })

  it('interpreta el estado que agrega MercadoPago', () => {
    expect(resolverEstadoDeRetorno({ status: 'approved' })).toBe('success')
    expect(resolverEstadoDeRetorno({ collection_status: 'in_process' })).toBe('pending')
    expect(resolverEstadoDeRetorno({ status: 'rejected' })).toBe('failure')
  })

  it('toma el primer valor cuando el parámetro está repetido', () => {
    expect(
      resolverEstadoDeRetorno({ resultado: ['pending', 'success'] }),
    ).toBe('pending')
  })

  it('no muestra éxito ante un valor desconocido', () => {
    expect(resolverEstadoDeRetorno({ resultado: 'cualquier-cosa' })).toBe('desconocido')
    expect(resolverEstadoDeRetorno({})).toBe('desconocido')
  })
})
