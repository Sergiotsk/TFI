import { describe, expect, it } from 'vitest'
import { ServicioDeAutenticacionFake } from '../../puertos/servicio-de-autenticacion/fake'
import { ConfirmarEnlaceDeEmailUseCase } from './confirmar-enlace-de-email'

async function conEnlacePendiente(): Promise<ServicioDeAutenticacionFake> {
  const auth = new ServicioDeAutenticacionFake()
  await auth.registrarAspirante({
    email: 'aspirante@example.com',
    contrasena: 'contrasenaSegura123',
    nombre: 'Ana',
    apellido: 'García',
    dni: '30123456',
    cuil: '27301234569',
    fechaDeNacimiento: '2000-05-15',
    sexo: 'F',
  })
  await auth.cerrarSesion()
  await auth.solicitarRecuperacionDeContrasena('aspirante@example.com')
  return auth
}

describe('ConfirmarEnlaceDeEmail', () => {
  it('canjea el código del enlace por una sesión', async () => {
    const auth = await conEnlacePendiente()
    const caso = new ConfirmarEnlaceDeEmailUseCase(auth)

    expect(await caso.ejecutar({ tipo: 'CODIGO', codigo: 'codigo-vigente' })).toBe(true)
    expect(await auth.usuarioAutenticado()).not.toBeNull()
  })

  it('acepta también el enlace con token_hash y tipo', async () => {
    const auth = await conEnlacePendiente()
    const caso = new ConfirmarEnlaceDeEmailUseCase(auth)

    const confirmado = await caso.ejecutar({
      tipo: 'TOKEN',
      tokenHash: 'token-vigente',
      tipoDeEnlace: 'recovery',
    })

    expect(confirmado).toBe(true)
    expect(await auth.usuarioAutenticado()).not.toBeNull()
  })

  it('devuelve false con un código inválido y no abre sesión', async () => {
    const auth = await conEnlacePendiente()
    const caso = new ConfirmarEnlaceDeEmailUseCase(auth)

    expect(await caso.ejecutar({ tipo: 'CODIGO', codigo: '' })).toBe(false)
    expect(await auth.usuarioAutenticado()).toBeNull()
  })

  it('devuelve false si no se pidió ningún enlace', async () => {
    const auth = new ServicioDeAutenticacionFake()
    const caso = new ConfirmarEnlaceDeEmailUseCase(auth)

    expect(await caso.ejecutar({ tipo: 'CODIGO', codigo: 'codigo-vigente' })).toBe(false)
  })
})
