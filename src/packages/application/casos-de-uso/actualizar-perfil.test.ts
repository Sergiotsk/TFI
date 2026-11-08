import { describe, expect, it } from 'vitest'
import { RepositorioDePerfilesFake } from '../puertos/repositorio-de-perfiles/fake'
import { ActualizarPerfilUseCase } from './actualizar-perfil'
import type { Actor } from './actor'
import { DatosDuplicados, NoAutorizado, NoEncontrado } from './errores'

const INSTITUCION = '00000000-0000-0000-0000-000000000001'

const secretaria: Actor = {
  perfilId: '2',
  rol: 'SECRETARIA',
  institucionId: INSTITUCION,
}

function armar() {
  const perfiles = new RepositorioDePerfilesFake()

  return { caso: new ActualizarPerfilUseCase(perfiles), perfiles }
}

describe('ActualizarPerfil', () => {
  it('actualiza los datos personales y conserva rol, email e institución', async () => {
    const { caso, perfiles } = armar()

    const actualizado = await caso.ejecutar(secretaria, '1', {
      nombre: 'Juan Carlos',
      apellido: 'Pérez',
      telefono: null,
      direccion: 'Otra calle 456',
    })

    expect(actualizado.nombre).toBe('Juan Carlos')
    expect(actualizado.telefono).toBeNull()
    expect(actualizado.direccion).toBe('Otra calle 456')
    expect(actualizado.rol).toBe('ASPIRANTE')
    expect(actualizado.email).toBe('juan.demo@example.com')
    expect(actualizado.institucionId).toBe(INSTITUCION)
    expect((await perfiles.obtenerPorId('1'))?.nombre).toBe('Juan Carlos')
  })

  it('también lo pueden hacer TESORERIA y DIRECCION', async () => {
    const { caso } = armar()

    await expect(
      caso.ejecutar({ ...secretaria, rol: 'TESORERIA' }, '1', { nombre: 'Juan' }),
    ).resolves.toMatchObject({ nombre: 'Juan' })
    await expect(
      caso.ejecutar({ ...secretaria, rol: 'DIRECCION' }, '1', { nombre: 'Juan' }),
    ).resolves.toMatchObject({ nombre: 'Juan' })
  })

  it('no lo puede hacer un ASPIRANTE', async () => {
    const { caso } = armar()

    await expect(
      caso.ejecutar({ ...secretaria, rol: 'ASPIRANTE' }, '1', { nombre: 'Juan' }),
    ).rejects.toThrow(NoAutorizado)
  })

  it('no encuentra un perfil de otra institución', async () => {
    const { caso } = armar()

    await expect(
      caso.ejecutar({ ...secretaria, institucionId: 'otra' }, '1', { nombre: 'Juan' }),
    ).rejects.toThrow(NoEncontrado)
  })

  it('no encuentra un perfil inexistente', async () => {
    const { caso } = armar()

    await expect(caso.ejecutar(secretaria, 'no-existe', { nombre: 'Juan' })).rejects.toThrow(
      NoEncontrado,
    )
  })

  it('rechaza un DNI que ya usa otro perfil', async () => {
    const { caso } = armar()

    await expect(caso.ejecutar(secretaria, '1', { dni: '10000002' })).rejects.toThrow(
      DatosDuplicados,
    )
  })

  it('rechaza un CUIL que ya usa otro perfil', async () => {
    const { caso } = armar()

    await expect(
      caso.ejecutar(secretaria, '1', { cuil: '27100000024' }),
    ).rejects.toThrow(DatosDuplicados)
  })
})
