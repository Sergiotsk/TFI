import { PeriodoDeIngreso, PeriodoInvalido } from '@tfi/domain'
import type { GeneradorDeIds } from '../puertos/generador-de-ids/puerto'
import type { Reloj } from '../puertos/reloj/puerto'
import type { RepositorioDePeriodos } from '../puertos/repositorio-de-periodos/puerto'
import type { Actor } from './actor'
import { exigirRol } from './actor'

export interface DatosDeNuevoPeriodo {
  nombre: string
  totalCupos: number
  cierraEl: Date
  diasPlazoPago: number
  montoMatriculaCentavos: number
}

/**
 * US3: DIRECCION da de alta un período de ingreso.
 *
 * Solo el Director: ni Secretaría ni Tesorería pueden crear períodos. El total
 * de cupos es solo un techo: la ocupación se deriva de las Postulaciones. La
 * institución es la del actor, no la que venga en el body.
 *
 * Un período nuevo no puede nacer cerrado: `cierraEl` tiene que ser posterior a
 * `ahora`. Los cupos, el plazo y el monto deben ser positivos.
 */
export class CrearPeriodoUseCase {
  constructor(
    private readonly periodos: RepositorioDePeriodos,
    private readonly generadorDeIds: GeneradorDeIds,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(actor: Actor, datos: DatosDeNuevoPeriodo): Promise<PeriodoDeIngreso> {
    exigirRol(actor, 'DIRECCION')

    if (datos.nombre.trim().length === 0) {
      throw new PeriodoInvalido('El nombre del período es obligatorio')
    }
    if (datos.totalCupos < 0) {
      throw new PeriodoInvalido('El total de cupos no puede ser negativo')
    }
    if (datos.diasPlazoPago <= 0) {
      throw new PeriodoInvalido('El plazo de pago debe ser de al menos un día')
    }
    if (datos.montoMatriculaCentavos <= 0) {
      throw new PeriodoInvalido('El monto de la matrícula debe ser mayor que cero')
    }
    if (datos.cierraEl <= this.reloj.ahora()) {
      throw new PeriodoInvalido('El período nuevo no puede cerrar en el pasado')
    }

    const periodo = new PeriodoDeIngreso(
      this.generadorDeIds.nuevo(),
      actor.institucionId,
      datos.nombre.trim(),
      datos.totalCupos,
      datos.cierraEl,
      datos.diasPlazoPago,
      datos.montoMatriculaCentavos,
    )

    await this.periodos.guardar(periodo)

    return periodo
  }
}
