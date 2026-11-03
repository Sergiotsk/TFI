import { describe, expect, it } from 'vitest'
import { ServicioDeAutenticacionFake } from '../../puertos/servicio-de-autenticacion/fake'
import { CambiarContrasenaUseCase } from './cambiar-contrasena'
import { ConfirmarEnlaceDeEmailUseCase } from './confirmar-enlace-de-email'
import { SolicitarRecuperacionDeContrasenaUseCase } from './solicitar-recuperacion-de-contrasena'

const CONTRASENA = 'contrasenaSegura123'
const NUEVA = 'contrasenaNueva123'

async function crearCuenta(): Promise<ServicioDeAutenticacionFake> {
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

describe('SolicitarRecuperacionDeContrasena', () => {
  it('responde igual exista o no la cuenta, para no filtrar qué emails hay', async () => {
    const auth = await crearCuenta()
    const caso = new SolicitarRecuperacionDeContrasenaUseCase(auth)

    const conCuenta = await caso.ejecutar('aspirante@example.com')
    const sinCuenta = await caso.ejecutar('no-existe@example.com')

    expect(conCuenta).toEqual(sinCuenta)
    expect(conCuenta.resultado).toBe('ENVIADO')
  })

  it('informa la falla de envío', async () => {
    const auth = await crearCuenta()
    auth.fallarLaRecuperacion = true
    const caso = new SolicitarRecuperacionDeContrasenaUseCase(auth)

    expect((await caso.ejecutar('aspirante@example.com')).resultado).toBe('NO_ENVIADO')
  })

  it('el enlace del email abre la sesión y permite elegir la contraseña nueva', async () => {
    const auth = await crearCuenta()
    await auth.cerrarSesion()

    await new SolicitarRecuperacionDeContrasenaUseCase(auth).ejecutar('aspirante@example.com')
    const confirmado = await new ConfirmarEnlaceDeEmailUseCase(auth).ejecutar({
      tipo: 'CODIGO',
      codigo: 'codigo-de-prueba',
    })

    expect(confirmado).toBe(true)
    expect(await auth.usuarioAutenticado()).not.toBeNull()

    await new CambiarContrasenaUseCase(auth).ejecutar(NUEVA)

    await auth.cerrarSesion()
    expect((await auth.iniciarSesion('aspirante@example.com', NUEVA)).resultado).toBe('INICIADA')
  })
})
