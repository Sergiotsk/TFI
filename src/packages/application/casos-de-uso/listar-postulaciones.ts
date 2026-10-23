import { ROLES_DEL_PERSONAL } from '@tfi/domain'
import type { Reloj } from '../puertos/reloj/puerto'
import { armarPagina, normalizarPaginacion } from '../paginacion'
import type { Pagina, Paginacion } from '../paginacion'
import type {
  FiltrosDePostulacion,
  RepositorioDePostulaciones,
} from '../puertos/repositorio-de-postulaciones/puerto'
import type { Actor } from './actor'
import { exigirRol } from './actor'
import { aPostulacionConsultada } from './postulacion-consultada'
import type { PostulacionConsultada } from './postulacion-consultada'

/**
 * Lectura del personal: lista las Postulaciones para hacer seguimiento.
 *
 * Solo los roles que no son `ASPIRANTE` (secretaría, dirección y tesorería).
 * El alcance por institución lo aplica RLS sobre los períodos; el caso de uso
 * decide el rol y devuelve el estado efectivo y el aviso de FR-007.
 *
 * Los filtros son opcionales: por aspirante (el "id de perfil"), por período y
 * por estado **persistido**. El listado completo es el caso sin filtros. La
 * respuesta está paginada.
 */
export class ListarPostulacionesUseCase {
  constructor(
    private readonly postulaciones: RepositorioDePostulaciones,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    actor: Actor,
    filtros: FiltrosDePostulacion = {},
    paginacion?: Partial<Paginacion>,
  ): Promise<Pagina<PostulacionConsultada>> {
    exigirRol(actor, ...ROLES_DEL_PERSONAL)

    const ahora = this.reloj.ahora()
    const normalizada = normalizarPaginacion(paginacion)
    const pagina = await this.postulaciones.listar(filtros, normalizada)

    return armarPagina(
      pagina.items.map((postulacion) => aPostulacionConsultada(postulacion, ahora)),
      pagina.total,
      normalizada,
    )
  }
}
