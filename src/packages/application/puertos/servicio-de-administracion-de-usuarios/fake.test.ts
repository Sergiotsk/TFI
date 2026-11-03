import { describe, expect, it } from 'vitest'
import { probarContratoServicioDeAdministracionDeUsuarios } from './contrato'
import { ServicioDeAdministracionDeUsuariosFake } from './fake'

probarContratoServicioDeAdministracionDeUsuarios(() => {
  const servicio = new ServicioDeAdministracionDeUsuariosFake()
  let contador = 0

  return {
    servicio,
    crearUsuario: () => {
      contador += 1
      const usuarioId = `usuario-fake-${contador}`
      servicio.sembrar(usuarioId)
      return Promise.resolve(usuarioId)
    },
  }
})

describe('ServicioDeAdministracionDeUsuariosFake', () => {
  it('guarda la contraseña nueva en la cuenta', async () => {
    const servicio = new ServicioDeAdministracionDeUsuariosFake()
    servicio.sembrar('usuario-1', 'vieja123456')

    await servicio.restablecerContrasena('usuario-1', 'nueva123456')

    expect(servicio.contrasenaDe('usuario-1')).toBe('nueva123456')
  })
})

