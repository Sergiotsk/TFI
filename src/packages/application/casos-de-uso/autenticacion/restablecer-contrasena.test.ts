import { describe, expect, it } from 'vitest'
import { Perfil } from '@tfi/domain'
import { RepositorioDePerfilesFake } from '../../puertos/repositorio-de-perfiles/fake'
import { ServicioDeAdministracionDeUsuariosFake } from '../../puertos/servicio-de-administracion-de-usuarios/fake'
import type { Actor } from '../actor'
import { NoAutorizado, NoEncontrado } from '../errores'
import { contrasenaInicialDe } from './contrasena-inicial'
import { RestablecerContrasenaUseCase } from './restablecer-contrasena'

const INSTITUCION = '00000000-0000-0000-0000-000000000001'
const OTRA_INSTITUCION = '00000000-0000-0000-0000-000000000002'

// Ids del RepositorioDePerfilesFake: 1 aspirante, 2 secretaria, 3 dirección, 4 tesorería.
const secretaria: Actor = { perfilId: '2', rol: 'SECRETARIA', institucionId: INSTITUCION }
const direccion: Actor = { perfilId: '3', rol: 'DIRECCION', institucionId: INSTITUCION }
const aspirante: Actor = { perfilId: '1', rol: 'ASPIRANTE', institucionId: INSTITUCION }
const secretariaDeOtraInstitucion: Actor = {
  perfilId: '2',
  rol: 'SECRETARIA',
  institucionId: OTRA_INSTITUCION,
}

function armar(cuentasDeAuth: string[] = ['1', '2', '3', '4']) {
  const perfiles = new RepositorioDePerfilesFake()
  const usuarios = new ServicioDeAdministracionDeUsuariosFake()

  for (const id of cuentasDeAuth) usuarios.sembrar(id)

  return {
    perfiles,
    usuarios,
    restablecer: new RestablecerContrasenaUseCase(usuarios, perfiles),
  }
}

/** Agrega una segunda Secretaría (id 5) para probar el reset entre pares. */
function conOtraSecretaria(mundo: ReturnType<typeof armar>) {
  mundo.perfiles.agregar(
    new Perfil(
      '5',
      'otra.secretaria@example.com',
      'Brenda',
      'Gómez',
      '10000005',
      '27100000057',
      new Date('1992-02-02'),
      'F',
      null,
      null,
      'SECRETARIA',
      INSTITUCION,
      true,
      new Date(),
      new Date(),
    ),
  )
  mundo.usuarios.sembrar('5')

  return mundo
}

describe('contrasenaInicialDe', () => {
  it('arma nombre + DNI sin acentos, espacios ni puntos', () => {
    expect(contrasenaInicialDe({ nombre: 'Ana María', dni: '30.123.456' })).toBe(
      'anamaria30123456',
    )
  })

  it('pasa el nombre a minúsculas', () => {
    expect(contrasenaInicialDe({ nombre: 'JUAN', dni: '10000001' })).toBe('juan10000001')
  })
})

describe('RestablecerContrasenaUseCase', () => {
  it('Secretaría deja la contraseña de un aspirante en nombre + DNI', async () => {
    const { restablecer, usuarios } = armar()

    const resultado = await restablecer.ejecutar(secretaria, '1')

    expect(resultado).toEqual({ perfilId: '1', contrasenaTemporal: 'juan10000001' })
    expect(usuarios.contrasenaDe('1')).toBe('juan10000001')
  })

  it('Dirección puede restablecer la contraseña de una Secretaría', async () => {
    const { restablecer, usuarios } = armar()

    const resultado = await restablecer.ejecutar(direccion, '2')

    expect(resultado.contrasenaTemporal).toBe('ana10000002')
    expect(usuarios.contrasenaDe('2')).toBe('ana10000002')
  })

  it('Secretaría no puede restablecer la contraseña de Dirección', async () => {
    const { restablecer, usuarios } = armar()

    await expect(restablecer.ejecutar(secretaria, '3')).rejects.toBeInstanceOf(NoAutorizado)
    expect(usuarios.contrasenaDe('3')).toBe('contrasenaOriginal123')
  })

  it('Secretaría no puede restablecer la contraseña de otra Secretaría', async () => {
    const { restablecer } = conOtraSecretaria(armar())

    await expect(restablecer.ejecutar(secretaria, '5')).rejects.toBeInstanceOf(NoAutorizado)
  })

  it('un aspirante no puede restablecer contraseñas', async () => {
    const { restablecer } = armar()

    await expect(restablecer.ejecutar(aspirante, '1')).rejects.toBeInstanceOf(NoAutorizado)
  })

  it('no se puede tocar un perfil de otra institución', async () => {
    const { restablecer, usuarios } = armar()

    await expect(
      restablecer.ejecutar(secretariaDeOtraInstitucion, '1'),
    ).rejects.toBeInstanceOf(NoEncontrado)
    expect(usuarios.contrasenaDe('1')).toBe('contrasenaOriginal123')
  })

  it('un perfil inexistente responde NoEncontrado', async () => {
    const { restablecer } = armar()

    await expect(restablecer.ejecutar(secretaria, '999')).rejects.toBeInstanceOf(NoEncontrado)
  })

  it('un perfil sin cuenta de Auth responde NoEncontrado', async () => {
    const { restablecer } = armar([])

    await expect(restablecer.ejecutar(secretaria, '1')).rejects.toBeInstanceOf(NoEncontrado)
  })
})
