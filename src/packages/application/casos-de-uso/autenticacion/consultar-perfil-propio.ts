import type { Perfil } from '@tfi/domain'
import type { ServicioDeAutenticacion } from '../../puertos/servicio-de-autenticacion/puerto'
import type { RepositorioDePerfiles } from '../../puertos/repositorio-de-perfiles/puerto'

export class ConsultarPerfilPropioUseCase {
  constructor(
    private readonly auth: ServicioDeAutenticacion,
    private readonly repoPerfiles: RepositorioDePerfiles,
  ) {}

  async ejecutar(): Promise<Perfil | null> {
    const sesion = await this.auth.usuarioAutenticado()
    if (!sesion) return null

    return this.repoPerfiles.obtenerPorId(sesion.id)
  }
}

