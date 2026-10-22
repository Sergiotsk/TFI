import type { Monto } from '../pago/monto'
import { CuposPorDebajoDeConfirmadas } from '../postulacion/errores'

const MS_POR_DIA = 24 * 60 * 60 * 1000

export class PeriodoDeIngreso {
  constructor(
    readonly id: string,
    readonly institucionId: string,
    readonly nombre: string,
    readonly totalCupos: number,
    readonly cierraEl: Date,
    readonly diasPlazoPago: number,
    readonly montoMatricula: Monto,
  ) {
    if (!Number.isSafeInteger(totalCupos) || totalCupos < 0) {
      throw new Error(`totalCupos inválido: ${totalCupos}. Debe ser un entero mayor o igual a 0.`)
    }
    if (!Number.isSafeInteger(diasPlazoPago) || diasPlazoPago <= 0) {
      throw new Error(`diasPlazoPago inválido: ${diasPlazoPago}. Debe ser un entero mayor a 0.`)
    }
    if (montoMatricula.centavos === 0) {
      throw new Error('montoMatricula inválido: debe ser mayor a 0 centavos.')
    }
  }

  /** Abierto hasta el instante de cierre inclusive. */
  estaAbierto(ahora: Date): boolean {
    return ahora.getTime() <= this.cierraEl.getTime()
  }

  /** `min(ahora + diasPlazoPago, cierraEl)`: el plazo de pago nunca pasa del cierre del período. */
  calcularVencimiento(ahora: Date): Date {
    const conPlazo = ahora.getTime() + this.diasPlazoPago * MS_POR_DIA
    return new Date(Math.min(conPlazo, this.cierraEl.getTime()))
  }

  /** Período nuevo con otro total de cupos. No puede quedar por debajo de las vacantes ya confirmadas. */
  conTotalCupos(totalCupos: number, ocupados: number): PeriodoDeIngreso {
    if (totalCupos < ocupados) {
      throw new CuposPorDebajoDeConfirmadas()
    }
    return new PeriodoDeIngreso(
      this.id,
      this.institucionId,
      this.nombre,
      totalCupos,
      this.cierraEl,
      this.diasPlazoPago,
      this.montoMatricula,
    )
  }
}
