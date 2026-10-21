import { User } from '@tfi/domain'
import { describe, expect, test } from 'vitest'
import { RepositorioDeUsuariosFake } from './fake'

describe('RepositorioDeUsuariosFake', () => {
  test('obtenerPorId de un id inexistente da null', async () => {
    const repositorio = new RepositorioDeUsuariosFake()

    expect(await repositorio.obtenerPorId('no-existe')).toBeNull()
  })

  test('guardar un usuario nuevo permite obtenerlo por id', async () => {
    const repositorio = new RepositorioDeUsuariosFake()
    const usuario = new User(
      '99',
      'Marta',
      'Demo',
      'marta.demo@example.com',
      'clave',
      '10000099',
      '27-10000099-1',
      new Date('2000-01-01'),
      'F',
      '1100000000',
      'Calle Demo 1',
      'INTERESADO',
      new Date('2026-01-01'),
      false,
    )

    await repositorio.guardar(usuario)

    expect(await repositorio.obtenerPorId('99')).toBe(usuario)
  })
})
