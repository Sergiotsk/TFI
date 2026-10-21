import { describe, expect, test } from 'vitest'
import { User } from './user'

describe('User', () => {
  test('expone los datos con los que se construyó', () => {
    const nacimiento = new Date('1990-05-15')
    const usuario = new User(
      '1',
      'Juan',
      'Pérez',
      'juan.demo@example.com',
      '123456',
      '10000001',
      '20-10000001-3',
      nacimiento,
      'M',
      '1122334455',
      'Calle Falsa 123',
      'INTERESADO',
      new Date('2026-01-01'),
      true,
    )

    expect(usuario.id).toBe('1')
    expect(usuario.dni).toBe('10000001')
    expect(usuario.birthdate).toBe(nacimiento)
    expect(usuario.role).toBe('INTERESADO')
    expect(usuario.verified).toBe(true)
  })
})
