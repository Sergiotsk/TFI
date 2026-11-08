import { describe, expect, it } from 'vitest'
import { probarContratoDeGeneradorDeIds } from '@tfi/application/contratos'
import { GeneradorDeIdsCrypto } from './generador-de-ids-crypto'

probarContratoDeGeneradorDeIds(() => new GeneradorDeIdsCrypto())

describe('GeneradorDeIdsCrypto', () => {
  it('devuelve un UUID v4', () => {
    expect(new GeneradorDeIdsCrypto().nuevo()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
  })
})
