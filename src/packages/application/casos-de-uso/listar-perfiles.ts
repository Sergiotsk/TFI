import { ROLES_DEL_PERSONAL } from '@tfi/domain'
import type { Perfil } from '@tfi/domain'
import type { Pagina, Paginacion } from '../paginacion'
import type { FiltrosDePerfil, RepositorioDePerfiles } from '../puertos/repositorio-de-perfiles/puerto'
import type { Actor } from './actor'
import { exigirRol } from './actor'

/**
 * Listado de perfiles para el personal de la facultad.
 *
 * Solo Secretaría, Dirección y Tesorería. Los filtros son opcionales: por rol y
 * por DNI exacto. La institución la acota RLS; el caso de uso solo decide el rol
 * y delega la paginación en el repositorio.
 */
export class ListarPerfilesUseCase {
  constructor(private readonly perfiles: RepositorioDePerfiles) {}

  async ejecutar(
    actor: Actor,
    filtros: FiltrosDePerfil,
    paginacion: Paginacion,
  ): Promise<Pagina<Perfil>> {
    exigirRol(actor, ...ROLES_DEL_PERSONAL)

    return this.perfiles.listar(filtros, paginacion)
  }
}
