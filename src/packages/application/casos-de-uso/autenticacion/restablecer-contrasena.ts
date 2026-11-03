import { ROLES_DEL_PERSONAL } from '@tfi/domain'
import type { Rol } from '@tfi/domain'
import type { RepositorioDePerfiles } from '../../puertos/repositorio-de-perfiles/puerto'
import type { ServicioDeAdministracionDeUsuarios } from '../../puertos/servicio-de-administracion-de-usuarios/puerto'
import { exigirRol } from '../actor'
import type { Actor } from '../actor'
import { NoAutorizado, NoEncontrado } from '../errores'
import { contrasenaInicialDe } from './contrasena-inicial'

/** Roles del personal que pueden restablecer contraseñas ajenas. */
export const ROLES_QUE_RESTABLECEN_CONTRASENAS: readonly Rol[] = ['SECRETARIA', 'DIRECCION']

export interface ResultadoDeRestablecimientoDeContrasena {
  perfilId: string
  /**
   * La contraseña nueva, que es la inicial (`nombre` + `dni`). Se devuelve para
   * que quien atiende pueda dictarla: se calcula con datos que ya ve en la
   * ficha del perfil, así que no revela nada nuevo.
   */
  contrasenaTemporal: string
}

/**
 * Restablecimiento asistido de contraseña.
 *
 * El personal cambia la contraseña de una cuenta sin pedir la anterior y la
 * deja en la inicial (`nombre` + `dni`). Es el camino de recuperación del MVP:
 * no depende de que la persona tenga acceso al email.
 *
 * Reglas de autorización (en el caso de uso, no en el borde):
 * - Solo Secretaría y Dirección.
 * - Solo perfiles de su institución (si no, `NoEncontrado` para no filtrar).
 * - Las cuentas del personal (Secretaría, Dirección y Tesorería) solo las
 *   resetea Dirección: si no, una Secretaría podría tomar la cuenta de un par
 *   o de otro rol con más permisos.
 */
export class RestablecerContrasenaUseCase {
  constructor(
    private readonly usuarios: ServicioDeAdministracionDeUsuarios,
    private readonly perfiles: RepositorioDePerfiles,
  ) {}

  async ejecutar(actor: Actor, perfilId: string): Promise<ResultadoDeRestablecimientoDeContrasena> {
    exigirRol(actor, ...ROLES_QUE_RESTABLECEN_CONTRASENAS)

    const perfil = await this.perfiles.obtenerPorId(perfilId)

    if (!perfil || perfil.institucionId !== actor.institucionId) {
      throw new NoEncontrado('El perfil no existe')
    }

    if (actor.rol !== 'DIRECCION' && ROLES_DEL_PERSONAL.includes(perfil.rol)) {
      throw new NoAutorizado('Solo Dirección puede restablecer la contraseña de ese perfil')
    }

    const contrasenaTemporal = contrasenaInicialDe(perfil)
    const resultado = await this.usuarios.restablecerContrasena(perfil.id, contrasenaTemporal)

    if (resultado.resultado === 'USUARIO_INEXISTENTE') {
      throw new NoEncontrado('El perfil no tiene una cuenta de acceso')
    }

    return { perfilId: perfil.id, contrasenaTemporal }
  }
}
