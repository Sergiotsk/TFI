import { describe, expect, it } from 'vitest'
import type { ServicioDeAdministracionDeUsuarios } from './puerto'

/** Escenario mínimo que cualquier adaptador tiene que poder armar. */
export interface EscenarioDeAdministracion {
  servicio: ServicioDeAdministracionDeUsuarios
  /** Crea la cuenta de Auth (o la simula) y devuelve su id. */
  crearUsuario: () => Promise<string>
}

/**
 * Suite de contrato del puerto `ServicioDeAdministracionDeUsuarios`.
 *
 * El fake en memoria la corre en cada PR. Un adaptador real la corre contra un
 * Supabase descartable, porque crear cuentas de Auth no se puede simular.
 */
export function probarContratoServicioDeAdministracionDeUsuarios(
  crearEscenario: () => Promise<EscenarioDeAdministracion> | EscenarioDeAdministracion,
) {
  describe('contrato: ServicioDeAdministracionDeUsuarios', () => {
    it('restablecerContrasena() cambia la contraseña de una cuenta existente', async () => {
      const { servicio, crearUsuario } = await crearEscenario()
      const usuarioId = await crearUsuario()

      const resultado = await servicio.restablecerContrasena(usuarioId, 'nuevaContrasena123')

      expect(resultado.resultado).toBe('RESTABLECIDA')
    })

    it('restablecerContrasena() informa USUARIO_INEXISTENTE si la cuenta no existe', async () => {
      const { servicio } = await crearEscenario()

      const resultado = await servicio.restablecerContrasena(
        'usuario-que-no-existe',
        'nuevaContrasena123',
      )

      expect(resultado.resultado).toBe('USUARIO_INEXISTENTE')
    })
  })
}
