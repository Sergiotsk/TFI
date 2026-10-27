import type {
  ResultadoDeRestablecimiento,
  ServicioDeAdministracionDeUsuarios,
} from './puerto'

interface UsuarioFakeRecord {
  id: string
  contrasena: string
}

/**
 * Administración de credenciales en memoria.
 *
 * Guarda la última contraseña de cada cuenta para que los tests del caso de uso
 * puedan verificar qué se escribió. Solo existen las cuentas sembradas: pedir
 * una desconocida devuelve `USUARIO_INEXISTENTE`, igual que el adaptador real
 * cuando Supabase responde 404.
 */
export class ServicioDeAdministracionDeUsuariosFake
  implements ServicioDeAdministracionDeUsuarios
{
  private readonly usuarios = new Map<string, UsuarioFakeRecord>()

  async restablecerContrasena(
    usuarioId: string,
    contrasena: string,
  ): Promise<ResultadoDeRestablecimiento> {
    const usuario = this.usuarios.get(usuarioId)
    if (!usuario) return { resultado: 'USUARIO_INEXISTENTE' }

    usuario.contrasena = contrasena
    return { resultado: 'RESTABLECIDA' }
  }

  // Helpers para tests

  /** Crea la cuenta de Auth que el adaptador real tendría en Supabase. */
  sembrar(usuarioId: string, contrasena = 'contrasenaOriginal123'): void {
    this.usuarios.set(usuarioId, { id: usuarioId, contrasena })
  }

  contrasenaDe(usuarioId: string): string | undefined {
    return this.usuarios.get(usuarioId)?.contrasena
  }

  reset(): void {
    this.usuarios.clear()
  }
}
