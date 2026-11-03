import { describe, expect, it } from 'vitest'
import { probarContratoServicioDeAutenticacion } from './contrato'
import { ServicioDeAutenticacionFake } from './fake'

probarContratoServicioDeAutenticacion(() => new ServicioDeAutenticacionFake())

/**
 * El pedido de recuperación no está en la suite de contrato porque contra
 * Supabase manda un email de verdad. Acá se prueba lo que el contrato promete:
 * que no distingue si el email existe y que una falla real se informa.
 */
describe('ServicioDeAutenticacionFake: pedido de recuperación', () => {
  it('responde ENVIADO exista o no la cuenta, para no filtrar qué emails hay', async () => {
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

    const conCuenta = await auth.solicitarRecuperacionDeContrasena('aspirante@example.com')
    const sinCuenta = await auth.solicitarRecuperacionDeContrasena('no-existe@example.com')

    expect(conCuenta).toEqual(sinCuenta)
    expect(conCuenta.resultado).toBe('ENVIADO')
    expect(auth.recuperacionesSolicitadas).toEqual([
      'aspirante@example.com',
      'no-existe@example.com',
    ])
  })

  it('informa NO_ENVIADO cuando el envío falla de verdad', async () => {
    const auth = new ServicioDeAutenticacionFake()
    auth.fallarLaRecuperacion = true

    const resultado = await auth.solicitarRecuperacionDeContrasena('aspirante@example.com')

    expect(resultado.resultado).toBe('NO_ENVIADO')
  })
})
