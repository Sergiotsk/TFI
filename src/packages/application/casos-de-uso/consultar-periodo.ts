import type { PeriodoDeIngreso } from '@tfi/domain'
import type { RepositorioDePeriodos } from '../puertos/repositorio-de-periodos/puerto'
import type { Actor } from './actor'
import { NoEncontrado } from './errores'

/**
 * Detalle de un período de ingreso.
 *
 * Cualquier usuario autenticado de la institución puede consultarlo: el
 * aspirante lo necesita para entender la ventana y el monto antes de
 * postularse. Un período de otra institución se comporta como inexistente.
 */
export class ConsultarPeriodoUseCase {
  constructor(private readonly periodos: RepositorioDePeriodos) {}

  async ejecutar(actor: Actor, periodoId: string): Promise<PeriodoDeIngreso> {
    const periodo = await this.periodos.obtenerPorId(periodoId)
    if (!periodo || periodo.institucionId !== actor.institucionId) {
      throw new NoEncontrado('El período de ingreso no existe')
    }

    return periodo
  }
}
