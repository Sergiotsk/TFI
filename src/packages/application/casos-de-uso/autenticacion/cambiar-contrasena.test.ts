import { describe, expect, it } from 'vitest'
import { NoAutorizado, SolicitudInvalida } from '../errores'
import { ServicioDeAutenticacionFake } from '../../puertos/servicio-de-autenticacion/fake'
import { CambiarContrasenaUseCase } from './cambiar-contrasena'

const CONTRASENA = 'contrasenaSegura123'

async function conSesionAbierta(): Promise<ServicioDeAutenticacionFake> {
  const auth = new ServicioDeAutenticacionFake()
  await auth.registrarAspirante({
    email: 'aspirante@example.com',
    contrasena: CONTRASENA,
    nombre: 'Ana',
    apellido: 'García',
    dni: '30123456',
    cuil: '27301234569',
    fechaDeNacimiento: '2000-05-15',
    sexo: 'F',
  })
  return auth
}

describe('CambiarContrasena', () => {
  it('cambia la contraseña de la cuenta con la sesión abierta', async () => {
    const auth = await conSesionAbierta()
    const caso = new CambiarContrasenaUseCase(auth)

    await caso.ejecutar('contrasenaNueva123')

    await auth.cerrarSesion()
    expect((await auth.iniciarSesion('aspirante@example.com', CONTRASENA)).resultado).toBe(
      'CREDENCIALES_INVALIDAS',
    )
    expect((await auth.iniciarSesion('aspirante@example.com', 'contrasenaNueva123')).resultado).toBe(
      'INICIADA',
    )
  })

  it('sin sesión responde NoAutorizado y no toca la contraseña', async () => {
    const auth = await conSesionAbierta()
    await auth.cerrarSesion()
    const caso = new CambiarContrasenaUseCase(auth)

    await expect(caso.ejecutar('contrasenaNueva123')).rejects.toBeInstanceOf(NoAutorizado)

    expect((await auth.iniciarSesion('aspirante@example.com', CONTRASENA)).resultado).toBe(
      'INICIADA',
    )
  })

  it('rechaza una contraseña que no cumple el largo mínimo', async () => {
    const auth = await conSesionAbierta()
    const caso = new CambiarContrasenaUseCase(auth)

    await expect(caso.ejecutar('corta')).rejects.toBeInstanceOf(SolicitudInvalida)

    await auth.cerrarSesion()
    expect((await auth.iniciarSesion('aspirante@example.com', CONTRASENA)).resultado).toBe(
      'INICIADA',
    )
  })

  it('traduce el rechazo de Auth a SolicitudInvalida', async () => {
    const auth = await conSesionAbierta()
    auth.rechazarElCambioDeContrasena = true
    const caso = new CambiarContrasenaUseCase(auth)

    await expect(caso.ejecutar('contrasenaNueva123')).rejects.toBeInstanceOf(SolicitudInvalida)
  })
})
