import { ROLES_DEL_PERSONAL } from '@tfi/domain'
import type { Reloj } from '../puertos/reloj/puerto'
import { armarPagina, normalizarPaginacion } from '../paginacion'
import type { Pagina, Paginacion } from '../paginacion'
import type { RepositorioDePostulaciones } from '../puertos/repositorio-de-postulaciones/puerto'
import type { Actor } from './actor'
import { exigirRol } from './actor'
import type { RepositorioDePerfiles } from '../puertos/repositorio-de-perfiles/puerto'
import { aPostulacionesDelPersonal } from './postulacion-del-personal'
import type { PostulacionDelPersonal } from './postulacion-del-personal'

/**
 * Búsqueda del personal por DNI del aspirante.
 *
 * Devuelve **cualquier estado** (no solo las pendientes de pago): la
 * Secretaría quiere ver el historial completo de la persona. El DNI se
 * normaliza a dígitos y el período es opcional. La respuesta está paginada.
 */
export class BuscarPostulacionesPorDniUseCase {
  constructor(
    private readonly postulaciones: RepositorioDePostulaciones,
    private readonly perfiles: RepositorioDePerfiles,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    actor: Actor,
    dni: string,
    periodoId?: string,
    paginacion?: Partial<Paginacion>,
  ): Promise<Pagina<PostulacionDelPersonal>> {
    exigirRol(actor, ...ROLES_DEL_PERSONAL)

    const ahora = this.reloj.ahora()
    const normalizada = normalizarPaginacion(paginacion)
    const pagina = await this.postulaciones.buscarPorDni(
      dni.replace(/\D/g, ''),
      normalizada,
      periodoId,
    )

    return armarPagina(
      await aPostulacionesDelPersonal(pagina.items, this.perfiles, ahora),
      pagina.total,
      normalizada,
    )
  }
}
