import type { Perfil, Rol } from '@tfi/domain'
import type { Pagina, Paginacion } from '../../paginacion'

/** Filtros del listado de perfiles del personal. */
export interface FiltrosDePerfil {
  rol?: Rol
  /** Búsqueda exacta por DNI; el DNI es único en la institución. */
  dni?: string
}

/**
 * Puerta de acceso a los perfiles.
 *
 * `guardar` no da de alta: el perfil lo crea el trigger de Auth al registrarse.
 * En el adaptador de Supabase actualiza solo los datos personales (nombre,
 * apellido, DNI, CUIL, nacimiento, sexo, teléfono y dirección); rol, email,
 * institución y verificación quedan fuera del GRANT.
 *
 * `listar` pagina en la base: el personal no recibe todos los perfiles de la
 * institución de una sola vez.
 */
export interface RepositorioDePerfiles {
  listar(filtros: FiltrosDePerfil, paginacion: Paginacion): Promise<Pagina<Perfil>>
  obtenerPorId(id: string): Promise<Perfil | null>
  buscarPorDni(dni: string): Promise<Perfil | null>
  guardar(perfil: Perfil): Promise<void>
}
