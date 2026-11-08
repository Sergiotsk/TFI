import type { Actor } from '../actor'
import type { ServicioDeAutenticacion } from '../../puertos/servicio-de-autenticacion/puerto'
import type { RepositorioDePerfiles } from '../../puertos/repositorio-de-perfiles/puerto'

export type ResultadoDeActor =
  | { resultado: 'AUTENTICADO'; actor: Actor }
  | { resultado: 'SIN_SESION' }
  | { resultado: 'SIN_PERFIL' }

// Arma el Actor desde la sesión de Supabase Auth y el perfil real de la base.
// La identidad sale de getUser() (que valida el JWT contra el servidor de Auth),
// nunca del contenido de una cookie (Principio VII, primera barrera).
export class ObtenerActorUseCase {
  constructor(
    private readonly auth: ServicioDeAutenticacion,
    private readonly repoPerfiles: RepositorioDePerfiles,
  ) {}

  async ejecutar(): Promise<ResultadoDeActor> {
    const sesion = await this.auth.usuarioAutenticado()
    if (!sesion) return { resultado: 'SIN_SESION' }

    const perfil = await this.repoPerfiles.obtenerPorId(sesion.id)
    if (!perfil) return { resultado: 'SIN_PERFIL' }

    return {
      resultado: 'AUTENTICADO',
      actor: {
        perfilId: perfil.id,
        rol: perfil.rol,
        institucionId: perfil.institucionId,
      },
    }
  }
}
