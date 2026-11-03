import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ResultadoDeRestablecimiento,
  ServicioDeAdministracionDeUsuarios,
} from '@tfi/application'

/**
 * Administración de cuentas sobre Supabase Auth.
 *
 * El cliente que recibe ya viene con la service role key (`auth.admin`): este
 * adaptador nunca se construye con el cliente de la sesión, porque puede
 * cambiar la contraseña de cualquier cuenta sin conocer la anterior.
 */
export class ServicioDeAdministracionDeUsuariosSupabase
  implements ServicioDeAdministracionDeUsuarios
{
  constructor(private readonly admin: SupabaseClient) {}

  async restablecerContrasena(
    usuarioId: string,
    contrasena: string,
  ): Promise<ResultadoDeRestablecimiento> {
    const { data, error } = await this.admin.auth.admin.updateUserById(usuarioId, {
      password: contrasena,
    })

    if (error) {
      if (error.status === 404 || error.code === 'user_not_found') {
        return { resultado: 'USUARIO_INEXISTENTE' }
      }

      throw new Error(`No se pudo restablecer la contraseña: ${error.message}`)
    }

    if (!data.user) return { resultado: 'USUARIO_INEXISTENTE' }

    return { resultado: 'RESTABLECIDA' }
  }
}
