import type { EstadoPostulacion } from './estados'

/**
 * Una transición que la máquina de estados no permite.
 *
 * Acepta el formato del dominio de la Postulación (`desde`, `hacia`) y el
 * formato con mensaje que usan los pagos.
 */
export class TransicionInvalida extends Error {
  readonly desde?: EstadoPostulacion
  readonly hacia?: EstadoPostulacion

  constructor(mensaje: string)
  constructor(desde: EstadoPostulacion, hacia: EstadoPostulacion)
  constructor(desdeOMensaje: EstadoPostulacion | string, hacia?: EstadoPostulacion) {
    super(
      hacia === undefined
        ? desdeOMensaje
        : `Transición inválida de ${desdeOMensaje} a ${hacia}`,
    )
    this.name = 'TransicionInvalida'

    if (hacia !== undefined) {
      this.desde = desdeOMensaje as EstadoPostulacion
      this.hacia = hacia
    }
  }
}

/** El período de ingreso ya cerró: no se puede iniciar el pago. */
export class PeriodoCerrado extends Error {
  constructor(readonly periodoId: string) {
    super('El período de ingreso está cerrado')
    this.name = 'PeriodoCerrado'
  }
}

/** El período se quedó sin cupos libres para aceptar nuevos pagos (FR-011). */
export class SinCuposParaIniciar extends Error {
  constructor(readonly periodoId: string) {
    super('El período no tiene cupos libres para iniciar el pago')
    this.name = 'SinCuposParaIniciar'
  }
}

/** El período se llenó antes de que el personal pudiera confirmar la vacante. */
export class SinCuposParaConfirmar extends Error {
  constructor(readonly periodoId: string) {
    super('El período no tiene cupos libres para confirmar la vacante')
    this.name = 'SinCuposParaConfirmar'
  }
}

/** No se puede bajar el total de cupos por debajo de las vacantes ya confirmadas. */
export class CuposPorDebajoDeConfirmadas extends Error {
  constructor(
    readonly totalCupos: number,
    readonly confirmadas: number,
  ) {
    super(
      `El total de cupos (${totalCupos}) no puede ser menor que las vacantes confirmadas (${confirmadas})`,
    )
    this.name = 'CuposPorDebajoDeConfirmadas'
  }
}

/** Ya hay una Postulación activa de ese aspirante en el período (índice único parcial). */
export class PostulacionDuplicada extends Error {
  constructor(
    readonly aspiranteId: string,
    readonly periodoId: string,
  ) {
    super('Ya hay una Postulación activa de este aspirante en el período')
    this.name = 'PostulacionDuplicada'
  }
}
