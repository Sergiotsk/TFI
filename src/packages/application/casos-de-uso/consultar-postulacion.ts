import { ROLES_DEL_PERSONAL } from '@tfi/domain'
import type { Reloj } from '../puertos/reloj/puerto'
import type { RepositorioDePostulaciones } from '../puertos/repositorio-de-postulaciones/puerto'
import type { Actor } from './actor'
import { exigirRol } from './actor'
import { NoAutorizado } from './errores'
import { aPostulacionConsultada } from './postulacion-consultada'
import type { PostulacionConsultada } from './postulacion-consultada'

/**
 * US2: leer una Postulación (y las propias del aspirante).
 *
 * Devuelve el estado **efectivo** y el aviso de FR-007. Puede verla el propio
 * aspirante o cualquier rol del personal; otro aspirante recibe `NoAutorizado`.
 */
export class ConsultarPostulacionUseCase {
  constructor(
    private readonly postulaciones: RepositorioDePostulaciones,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(actor: Actor, postulacionId: string): Promise<PostulacionConsultada | null> {
    const postulacion = await this.postulaciones.obtenerPorId(postulacionId)
    if (!postulacion) return null

    if (!esPropia(postulacion.aspiranteId, actor) && !esPersonal(actor)) {
      throw new NoAutorizado()
    }

    return aPostulacionConsultada(postulacion, this.reloj.ahora())
  }

  async listarMias(actor: Actor): Promise<PostulacionConsultada[]> {
    exigirRol(actor, 'ASPIRANTE')

    const ahora = this.reloj.ahora()
    const propias = await this.postulaciones.listar({ aspiranteId: actor.perfilId })

    return propias.map((postulacion) => aPostulacionConsultada(postulacion, ahora))
  }
}

function esPropia(aspiranteId: string, actor: Actor): boolean {
  return aspiranteId === actor.perfilId
}

function esPersonal(actor: Actor): boolean {
  return ROLES_DEL_PERSONAL.includes(actor.rol)
}
