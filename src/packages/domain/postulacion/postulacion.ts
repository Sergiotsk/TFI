import type { EstadoPostulacion } from './estados'
import { TRANSICIONES } from './estados'
import type { MotivoRevision } from './motivoRevision'
import { NumeroDePostulacion } from './numero-de-postulacion'
import { TransicionInvalida } from './errores'

interface CambiosDePostulacion {
  estado?: EstadoPostulacion
  venceEl?: Date | null
  motivoRevision?: MotivoRevision | null
}

/**
 * Postulación: raíz de agregado y máquina de estados.
 *
 * Es inmutable: cada transición devuelve una Postulación nueva con el mismo id.
 * Las transiciones inválidas son imposibles: `exigirTransicion` las rechaza con
 * `TransicionInvalida` (constitución, Principio II).
 *
 * `estado` es el estado **persistido**. El estado efectivo se pide con
 * `estadoEn(ahora)`: una Postulación guardada como `PAGO_PENDIENTE` cuyo plazo
 * pasó se lee como `VENCIDO` sin que nadie escriba la fila.
 */
export class Postulacion {
  constructor(
    readonly id: string,
    readonly numero: NumeroDePostulacion,
    readonly aspiranteId: string,
    readonly periodoId: string,
    readonly estado: EstadoPostulacion,
    readonly venceEl: Date | null,
    readonly motivoRevision: MotivoRevision | null,
    readonly creadoEl: Date,
    readonly actualizadoEl: Date,
  ) {
    this.validarInvariantes()
  }

  /** Estado efectivo a una fecha dada. `PAGO_EN_REVISION` no vence (FR-013). */
  estadoEn(ahora: Date): EstadoPostulacion {
    if (this.estado === 'PAGO_PENDIENTE' && this.venceEl !== null && ahora > this.venceEl) {
      return 'VENCIDO'
    }

    return this.estado
  }

  /** Elige medio de pago: arranca (o reinicia) el plazo. */
  iniciarPago(venceEl: Date, ahora: Date): Postulacion {
    this.exigirTransicion('PAGO_PENDIENTE', ahora)

    return this.con({ estado: 'PAGO_PENDIENTE', venceEl, motivoRevision: null })
  }

  /** Pago acreditado dentro del plazo y con cupo: la vacante queda confirmada. */
  confirmar(ahora: Date): Postulacion {
    this.exigirTransicion('VACANTE_CONFIRMADA', ahora, ['PAGO_PENDIENTE', 'VENCIDO'])

    return this.con({ estado: 'VACANTE_CONFIRMADA', motivoRevision: null })
  }

  /** Pago fuera de plazo o sin cupo: lo decide Dirección. */
  pasarARevision(motivo: MotivoRevision, ahora: Date): Postulacion {
    this.exigirTransicion('PAGO_EN_REVISION', ahora)

    return this.con({ estado: 'PAGO_EN_REVISION', motivoRevision: motivo })
  }

  /** Dirección acepta la excepción: la vacante se confirma aunque el período esté lleno. */
  aceptarExcepcion(ahora: Date): Postulacion {
    this.exigirTransicion('VACANTE_CONFIRMADA', ahora, ['PAGO_EN_REVISION'])

    return this.con({ estado: 'VACANTE_CONFIRMADA', motivoRevision: null })
  }

  /** Dirección rechaza la excepción: la Postulación vuelve a `VENCIDO`. */
  rechazarExcepcion(ahora: Date): Postulacion {
    this.exigirTransicion('VENCIDO', ahora, ['PAGO_EN_REVISION'])

    return this.con({ estado: 'VENCIDO', motivoRevision: null })
  }

  private exigirTransicion(
    hacia: EstadoPostulacion,
    ahora: Date,
    origenes?: readonly EstadoPostulacion[],
  ): void {
    const desde = this.estadoEn(ahora)
    const permitidas = TRANSICIONES[desde]

    if (!permitidas.includes(hacia) || (origenes !== undefined && !origenes.includes(desde))) {
      throw new TransicionInvalida(desde, hacia)
    }
  }

  private con(cambios: CambiosDePostulacion): Postulacion {
    return new Postulacion(
      this.id,
      this.numero,
      this.aspiranteId,
      this.periodoId,
      cambios.estado ?? this.estado,
      cambios.venceEl !== undefined ? cambios.venceEl : this.venceEl,
      cambios.motivoRevision !== undefined ? cambios.motivoRevision : this.motivoRevision,
      this.creadoEl,
      this.actualizadoEl,
    )
  }

  /** Espeja los CHECK de la base: si la fila es inconsistente, se nota acá y no en la UI. */
  private validarInvariantes(): void {
    if (this.estado === 'PAGO_PENDIENTE' && this.venceEl === null) {
      throw new Error('Una Postulación en PAGO_PENDIENTE necesita vencimiento')
    }

    const enRevision = this.estado === 'PAGO_EN_REVISION'
    if (enRevision !== (this.motivoRevision !== null)) {
      throw new Error(
        'El motivo de revisión existe si y solo si la Postulación está en PAGO_EN_REVISION',
      )
    }
  }
}
