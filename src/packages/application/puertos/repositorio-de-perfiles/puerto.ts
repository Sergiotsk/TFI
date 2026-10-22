import type { Perfil, Rol } from '@tfi/domain'

/**
 * Puerta de acceso a los perfiles.
 *
 * `guardar` no da de alta: el perfil lo crea el trigger de Auth al registrarse.
 * En el adaptador de Supabase actualiza solo los datos personales (nombre,
 * apellido, DNI, CUIL, nacimiento, sexo, teléfono y dirección); rol, email,
 * institución y verificación quedan fuera del GRANT.
 */
export interface RepositorioDePerfiles {
  obtenerTodos(): Promise<Perfil[]>
  obtenerPorId(id: string): Promise<Perfil | null>
  obtenerPorRol(rol: Rol): Promise<Perfil[] | null>
  guardar(perfil: Perfil): Promise<void>
}
