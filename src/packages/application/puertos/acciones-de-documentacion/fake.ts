import type { Postulacion } from '@tfi/domain'
import type { Reloj } from '../reloj/puerto'
import type { RepositorioDePostulaciones } from '../repositorio-de-postulaciones/puerto'
import type {
  AccionesDeDocumentacion,
  ResultadoDeDocumentacion,
} from './puerto'

/**
 * Fake del circuito de documentación.
 *
 * Reusa el repositorio de Postulaciones (y su concurrencia optimista) para que
 * los tests de los casos de uso vean el estado actualizado en el mismo lugar
 * que consultan. La autorización no la simula: la primera barrera está en el
 * caso de uso y la segunda en la RPC real.
 */
export class AccionesDeDocumentacionFake implements AccionesDeDocumentacion {
  constructor(
    private readonly postulaciones: RepositorioDePostulaciones,
    private readonly reloj: Reloj,
  ) {}

  async transicionar(
    postulacionId: string,
    hacia: Postulacion['estado'],
  ): Promise<ResultadoDeDocumentacion> {
    const antes = await this.postulaciones.obtenerPorId(postulacionId)
    if (!antes) return 'NO_ENCONTRADA'

    let despues: Postulacion
    try {
      despues = antes.avanzarDocumentacion(hacia, this.reloj.ahora())
    } catch {
      return 'TRANSICION_INVALIDA'
    }

    const resultado = await this.postulaciones.guardarTransicion(antes, despues)

    return resultado === 'ok' ? 'OK' : 'CONFLICTO'
  }
}
