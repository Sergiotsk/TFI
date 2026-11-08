import { describe, expect, it } from 'vitest'
import { ServicioDeAutenticacionFake } from '../../puertos/servicio-de-autenticacion/fake'
import { IniciarSesionUseCase } from './iniciar-sesion'

describe('IniciarSesion', () => {
  it('inicia sesión con las credenciales correctas', async () => {
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
    const caso = new IniciarSesionUseCase(auth)

    const resultado = await caso.ejecutar('aspirante@example.com', 'contrasenaSegura123')

    expect(resultado.resultado).toBe('INICIADA')
  })

  it('no revela si el email existe: credenciales inválidas dan CREDENCIALES_INVALIDAS', async () => {
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
    const caso = new IniciarSesionUseCase(auth)

    const conContrasenaMala = await caso.ejecutar('aspirante@example.com', 'mala')
    const conEmailInexistente = await caso.ejecutar('no-existe@example.com', 'mala')

    expect(conContrasenaMala.resultado).toBe('CREDENCIALES_INVALIDAS')
    expect(conEmailInexistente.resultado).toBe('CREDENCIALES_INVALIDAS')
  })
})
