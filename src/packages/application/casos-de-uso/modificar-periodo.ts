import { CuposPorDebajoDeConfirmadas, PeriodoDeIngreso } from '@tfi/domain'
import type { RepositorioDePeriodos } from '../puertos/repositorio-de-periodos/puerto'
import type { Actor } from './actor'
import { exigirRol } from './actor'
import { NoEncontrado } from './errores'

export interface CambiosDePeriodo {
  nombre?: string
  totalCupos?: number
  cierraEl?: Date
  diasPlazoPago?: number
  montoMatriculaCentavos?: number
}

/**
 * US3: DIRECCION modifica un período de ingreso.
 *
 * Solo el Director: Secretaría y Tesorería pueden ver los períodos, pero no
 * crearlos ni modificarlos. El total de cupos nunca puede quedar por debajo de
 * las vacantes ya confirmadas (FR-005). No se puede cambiar de institución: el
 * período se busca dentro de la institución del actor.
 */
export class ModificarPeriodoUseCase {
  constructor(private readonly periodos: RepositorioDePeriodos) {}

  async ejecutar(
    actor: Actor,
    periodoId: string,
    cambios: CambiosDePeriodo,
  ): Promise<PeriodoDeIngreso> {
    exigirRol(actor, 'DIRECCION')

    const actual = await this.periodos.obtenerPorId(periodoId)
    if (!actual || actual.institucionId !== actor.institucionId) {
      throw new NoEncontrado('El período de ingreso no existe')
    }

    const totalCupos = cambios.totalCupos ?? actual.totalCupos
    if (totalCupos < actual.totalCupos) {
      const confirmadas = await this.periodos.contarOcupados(periodoId)
      if (totalCupos < confirmadas) {
        throw new CuposPorDebajoDeConfirmadas(totalCupos, confirmadas)
      }
    }

    const actualizado = new PeriodoDeIngreso(
      actual.id,
      actual.institucionId,
      cambios.nombre ?? actual.nombre,
      totalCupos,
      cambios.cierraEl ?? actual.cierraEl,
      cambios.diasPlazoPago ?? actual.diasPlazoPago,
      cambios.montoMatriculaCentavos ?? actual.montoMatriculaCentavos,
    )

    await this.periodos.guardar(actualizado)

    return actualizado
  }
}
