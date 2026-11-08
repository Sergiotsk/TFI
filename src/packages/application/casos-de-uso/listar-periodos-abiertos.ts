import type { PeriodoDeIngreso } from '@tfi/domain'
import type { Reloj } from '../puertos/reloj/puerto'
import type { RepositorioDePeriodos } from '../puertos/repositorio-de-periodos/puerto'
import type { Actor } from './actor'

/**
 * US3: los períodos abiertos de la institución del actor.
 *
 * Cualquier usuario autenticado los necesita: el aspirante para elegir dónde
 * postularse y el personal para operar. La institución sale del actor, nunca del
 * request.
 */
export class ListarPeriodosAbiertosUseCase {
  constructor(
    private readonly periodos: RepositorioDePeriodos,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(actor: Actor): Promise<PeriodoDeIngreso[]> {
    return this.periodos.listarAbiertos(actor.institucionId, this.reloj.ahora())
  }
}
