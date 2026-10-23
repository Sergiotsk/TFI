import { ROLES_DEL_PERSONAL } from '@tfi/domain'
import type { PeriodoDeIngreso } from '@tfi/domain'
import type { Pagina, Paginacion } from '../paginacion'
import type { RepositorioDePeriodos } from '../puertos/repositorio-de-periodos/puerto'
import type { Actor } from './actor'
import { exigirRol } from './actor'

/**
 * US3: listado completo de períodos para el personal.
 *
 * A diferencia de `ListarPeriodosAbiertos`, incluye los cerrados: Secretaría,
 * Tesorería y Dirección necesitan el histórico. El alcance por institución sale
 * del actor y la paginación la resuelve el repositorio.
 */
export class ListarPeriodosTodosUseCase {
  constructor(private readonly periodos: RepositorioDePeriodos) {}

  async ejecutar(actor: Actor, paginacion: Paginacion): Promise<Pagina<PeriodoDeIngreso>> {
    exigirRol(actor, ...ROLES_DEL_PERSONAL)

    return this.periodos.listarTodos(actor.institucionId, paginacion)
  }
}
