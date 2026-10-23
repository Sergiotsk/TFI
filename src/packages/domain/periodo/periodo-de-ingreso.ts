import { Monto } from '../pago/monto'
import { CuposPorDebajoDeConfirmadas } from '../postulacion/errores'

const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000

/**
 * Un período de ingreso: la ventana en la que se puede iniciar el pago.
 *
 * `totalCupos` es el techo, pero la ocupación no se guarda como contador: se
 * deriva de las Postulaciones (data-model.md, "Ocupación derivada"). El período
 * solo aporta el total y las fechas.
 */
export class PeriodoDeIngreso {
  readonly montoMatriculaCentavos: number

  constructor(
    readonly id: string,
    readonly institucionId: string,
    readonly nombre: string,
    readonly totalCupos: number,
    readonly cierraEl: Date,
    readonly diasPlazoPago: number,
    montoMatricula: number | Monto,
  ) {
    const montoMatriculaCentavos =
      montoMatricula instanceof Monto ? montoMatricula.centavos : montoMatricula

    if (!Number.isSafeInteger(totalCupos) || totalCupos < 0) {
      throw new Error(`Total de cupos inválido: ${totalCupos}`)
    }

    if (!Number.isSafeInteger(diasPlazoPago) || diasPlazoPago <= 0) {
      throw new Error(`Días de plazo de pago inválidos: ${diasPlazoPago}`)
    }

    if (!Number.isSafeInteger(montoMatriculaCentavos) || montoMatriculaCentavos <= 0) {
      throw new Error(`Monto de matrícula inválido: ${montoMatriculaCentavos}`)
    }

    this.montoMatriculaCentavos = montoMatriculaCentavos
  }

  /** El dominio de pagos usa el value object `Monto`. */
  get montoMatricula(): Monto {
    return new Monto(this.montoMatriculaCentavos)
  }

  /** El período está abierto hasta el cierre, inclusive. */
  estaAbierto(ahora: Date): boolean {
    return ahora <= this.cierraEl
  }

  /** El plazo de pago nunca puede pasarse del cierre del período. */
  calcularVencimiento(ahora: Date): Date {
    const vencimiento = new Date(ahora.getTime() + this.diasPlazoPago * MILISEGUNDOS_POR_DIA)
    return vencimiento < this.cierraEl ? vencimiento : this.cierraEl
  }

  /** Cupos que todavía se pueden ofrecer: libres de confirmadas y de pendientes vigentes. */
  cuposLibres(ocupados: number, pendientesVigentes: number): number {
    return this.totalCupos - ocupados - pendientesVigentes
  }

  /** Cambia el total de cupos sin permitir quedar por debajo de las vacantes confirmadas. */
  conTotalCupos(totalCupos: number, confirmadas: number): PeriodoDeIngreso {
    if (totalCupos < confirmadas) {
      throw new CuposPorDebajoDeConfirmadas(totalCupos, confirmadas)
    }

    return new PeriodoDeIngreso(
      this.id,
      this.institucionId,
      this.nombre,
      totalCupos,
      this.cierraEl,
      this.diasPlazoPago,
      this.montoMatriculaCentavos,
    )
  }
}
