const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000

/**
 * Un período de ingreso: la ventana en la que se puede iniciar el pago.
 *
 * `totalCupos` es el techo, pero la ocupación no se guarda como contador: se
 * deriva de las Postulaciones (data-model.md, "Ocupación derivada"). El período
 * solo aporta el total y las fechas.
 */
export class PeriodoDeIngreso {
  constructor(
    readonly id: string,
    readonly institucionId: string,
    readonly nombre: string,
    readonly totalCupos: number,
    readonly cierraEl: Date,
    readonly diasPlazoPago: number,
    readonly montoMatriculaCentavos: number,
  ) {}

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
}
