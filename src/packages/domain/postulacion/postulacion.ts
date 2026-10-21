import type { PeriodoDeIngreso } from '../periodo/periodo-de-ingreso'
import { PeriodoCerrado, SinCuposParaIniciar, TransicionInvalida } from './errores'
import { type EstadoDePostulacion, type MotivoDeRevision, ocupaCupo } from './estados'
import type { NumeroDePostulacion } from './numero-de-postulacion'

// Raíz de agregado. Es inmutable: cada transición devuelve una Postulación nueva o lanza TransicionInvalida.
// Las transiciones que dependen del pago (`confirmar`, `pasarARevision`) miran el estado PERSISTIDO (`estado`),
// no el efectivo: quien decide con el estado efectivo (`estadoEn`) es `iniciarPago`.
export class Postulacion {
  constructor(
    readonly id: string,
    readonly numero: NumeroDePostulacion,
    readonly aspiranteId: string,
    readonly periodoId: string,
    readonly estado: EstadoDePostulacion,
    /** Obligatorio en PAGO_PENDIENTE. Se conserva después (VENCIDO, confirmada) para auditoría. */
    readonly venceEl?: Date,
    /** Solo en PAGO_EN_REVISION. */
    readonly motivoRevision?: MotivoDeRevision,
  ) {
    if (estado === 'PAGO_PENDIENTE' && venceEl === undefined) {
      throw new Error('Una Postulación en PAGO_PENDIENTE debe tener venceEl.')
    }
    if ((estado === 'PAGO_EN_REVISION') !== (motivoRevision !== undefined)) {
      throw new Error('motivoRevision es obligatorio en PAGO_EN_REVISION y solo se admite en ese estado.')
    }
  }

  static crear(id: string, numero: NumeroDePostulacion, aspiranteId: string, periodoId: string): Postulacion {
    return new Postulacion(id, numero, aspiranteId, periodoId, 'PREINSCRIPTO')
  }

  /** `true` si cuenta para la ocupación del período (VACANTE_CONFIRMADA o posterior). */
  get ocupaCupo(): boolean {
    return ocupaCupo(this.estado)
  }

  /** Estado efectivo: un PAGO_PENDIENTE con el plazo vencido se ve VENCIDO (vencimiento perezoso). */
  estadoEn(ahora: Date): EstadoDePostulacion {
    if (this.estado === 'PAGO_PENDIENTE' && this.haVencido(ahora)) {
      return 'VENCIDO'
    }
    return this.estado
  }

  /** Persiste el vencimiento perezoso: PAGO_PENDIENTE → VENCIDO, solo si ya pasó `venceEl`. */
  registrarVencimiento(ahora: Date): Postulacion {
    if (this.estado !== 'PAGO_PENDIENTE' || !this.haVencido(ahora)) {
      throw new TransicionInvalida(`No se puede registrar el vencimiento desde ${this.estado} en ese momento.`)
    }
    return this.con('VENCIDO')
  }

  /**
   * PREINSCRIPTO | VENCIDO → PAGO_PENDIENTE, con período abierto y cupos libres (FR-011).
   * `ocupados` son las vacantes ya confirmadas del período.
   */
  iniciarPago(periodo: PeriodoDeIngreso, ocupados: number, ahora: Date): Postulacion {
    const efectivo = this.estadoEn(ahora)
    if (efectivo !== 'PREINSCRIPTO' && efectivo !== 'VENCIDO') {
      throw new TransicionInvalida(`No se puede iniciar el pago desde ${efectivo}.`)
    }
    if (!periodo.estaAbierto(ahora)) {
      throw new PeriodoCerrado()
    }
    if (ocupados >= periodo.totalCupos) {
      throw new SinCuposParaIniciar()
    }
    return this.con('PAGO_PENDIENTE', periodo.calcularVencimiento(ahora))
  }

  /** PAGO_PENDIENTE | VENCIDO → VACANTE_CONFIRMADA, solo si el pago fue en plazo (`pagadoEl <= venceEl`). */
  confirmar(pagadoEl: Date): Postulacion {
    this.exigirEstado(['PAGO_PENDIENTE', 'VENCIDO'], 'confirmar')
    if (!this.pagoEnPlazo(pagadoEl)) {
      throw new TransicionInvalida('No se puede confirmar: el pago fue posterior al vencimiento.')
    }
    return this.con('VACANTE_CONFIRMADA')
  }

  /**
   * PAGO_PENDIENTE | VENCIDO → PAGO_EN_REVISION con el motivo (SIN_CUPO | FUERA_DE_PLAZO).
   * Desde VENCIDO el diagrama de data-model.md solo dibuja FUERA_DE_PLAZO, pero la regla 7 de `evaluarPago`
   * puede dar SIN_CUPO para un pago en plazo informado tarde; se admite para que ese pago no se pierda.
   */
  pasarARevision(motivo: MotivoDeRevision): Postulacion {
    this.exigirEstado(['PAGO_PENDIENTE', 'VENCIDO'], 'pasar a revisión')
    return this.con('PAGO_EN_REVISION', this.venceEl, motivo)
  }

  /** PAGO_EN_REVISION → VACANTE_CONFIRMADA (decisión de Dirección). */
  aceptarExcepcion(): Postulacion {
    this.exigirEstado(['PAGO_EN_REVISION'], 'aceptar la excepción')
    return this.con('VACANTE_CONFIRMADA')
  }

  /** PAGO_EN_REVISION → VENCIDO (decisión de Dirección). Después puede reintentar con `iniciarPago`. */
  rechazarExcepcion(): Postulacion {
    this.exigirEstado(['PAGO_EN_REVISION'], 'rechazar la excepción')
    return this.con('VENCIDO')
  }

  private haVencido(ahora: Date): boolean {
    return this.venceEl !== undefined && ahora.getTime() > this.venceEl.getTime()
  }

  private pagoEnPlazo(pagadoEl: Date): boolean {
    return this.venceEl !== undefined && pagadoEl.getTime() <= this.venceEl.getTime()
  }

  private exigirEstado(permitidos: readonly EstadoDePostulacion[], accion: string): void {
    if (!permitidos.includes(this.estado)) {
      throw new TransicionInvalida(`No se puede ${accion} desde ${this.estado}.`)
    }
  }

  private con(estado: EstadoDePostulacion, venceEl: Date | undefined = this.venceEl, motivo?: MotivoDeRevision) {
    return new Postulacion(this.id, this.numero, this.aspiranteId, this.periodoId, estado, venceEl, motivo)
  }
}
