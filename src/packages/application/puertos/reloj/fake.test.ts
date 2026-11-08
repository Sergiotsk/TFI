import { describe, expect, it } from 'vitest'
import { probarContratoDeReloj } from './contrato'
import { RelojFijo } from './fake'

probarContratoDeReloj(() => new RelojFijo())

describe('RelojFijo', () => {
  it('avanza exactamente los milisegundos pedidos', () => {
    const reloj = new RelojFijo(new Date('2026-01-01T00:00:00.000Z'))

    reloj.avanzar(1_500)

    expect(reloj.ahora()).toEqual(new Date('2026-01-01T00:00:01.500Z'))
  })

  it('no deja mutar el instante desde afuera', () => {
    const reloj = new RelojFijo(new Date('2026-01-01T00:00:00.000Z'))

    reloj.ahora().setFullYear(1999)

    expect(reloj.ahora().getUTCFullYear()).toBe(2026)
  })
})
