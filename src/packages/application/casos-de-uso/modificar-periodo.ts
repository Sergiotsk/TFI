import { CuposPorDebajoDeConfirmadas, PeriodoDeIngreso, PeriodoInvalido } from '@tfi/domain'
import type { Reloj } from '../puertos/reloj/puerto'
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
 *
 * Si se cambia el cierre, la nueva fecha no puede quedar en el pasado. Los
 * demás valores deben seguir siendo positivos.
 */
export class ModificarPeriodoUseCase {
  constructor(
    private readonly periodos: RepositorioDePeriodos,
    private readonly reloj: Reloj,
  ) {}

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

    const nombre = cambios.nombre?.trim() ?? actual.nombre
    if (nombre.length === 0) {
      throw new PeriodoInvalido('El nombre del período es obligatorio')
    }

    const totalCupos = cambios.totalCupos ?? actual.totalCupos
    if (totalCupos < 0) {
      throw new PeriodoInvalido('El total de cupos no puede ser negativo')
    }
    if (totalCupos < actual.totalCupos) {
      const confirmadas = await this.periodos.contarOcupados(periodoId)
      if (totalCupos < confirmadas) {
        throw new CuposPorDebajoDeConfirmadas(totalCupos, confirmadas)
      }
    }

    const diasPlazoPago = cambios.diasPlazoPago ?? actual.diasPlazoPago
    if (diasPlazoPago <= 0) {
      throw new PeriodoInvalido('El plazo de pago debe ser de al menos un día')
    }

    const montoMatriculaCentavos =
      cambios.montoMatriculaCentavos ?? actual.montoMatriculaCentavos
    if (montoMatriculaCentavos <= 0) {
      throw new PeriodoInvalido('El monto de la matrícula debe ser mayor que cero')
    }

    const cierraEl = cambios.cierraEl ?? actual.cierraEl
    if (cierraEl.getTime() !== actual.cierraEl.getTime() && cierraEl <= this.reloj.ahora()) {
      throw new PeriodoInvalido('El cierre del período no puede quedar en el pasado')
    }

    const actualizado = new PeriodoDeIngreso(
      actual.id,
      actual.institucionId,
      nombre,
      totalCupos,
      cierraEl,
      diasPlazoPago,
      montoMatriculaCentavos,
    )

    await this.periodos.guardar(actualizado)

    return actualizado
  }
}
