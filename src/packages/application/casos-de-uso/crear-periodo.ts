import { PeriodoDeIngreso } from '@tfi/domain'
import type { GeneradorDeIds } from '../puertos/generador-de-ids/puerto'
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
 * US3: SECRETARIA o DIRECCION dan de alta un período de ingreso.
 *
 * El total de cupos es solo un techo: la ocupación se deriva de las
 * Postulaciones. La institución es la del actor, no la que venga en el body.
 */
export class CrearPeriodoUseCase {
  constructor(
    private readonly periodos: RepositorioDePeriodos,
    private readonly generadorDeIds: GeneradorDeIds,
  ) {}

  async ejecutar(actor: Actor, datos: DatosDeNuevoPeriodo): Promise<PeriodoDeIngreso> {
    exigirRol(actor, 'SECRETARIA', 'DIRECCION')

    const periodo = new PeriodoDeIngreso(
      this.generadorDeIds.nuevo(),
      actor.institucionId,
      datos.nombre,
      datos.totalCupos,
      datos.cierraEl,
      datos.diasPlazoPago,
      datos.montoMatriculaCentavos,
    )

    await this.periodos.guardar(periodo)

    return periodo
  }
}
