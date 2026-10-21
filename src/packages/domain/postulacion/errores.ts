// Errores del dominio. `NoAutorizado` no está acá: lo lanza el caso de uso, no la entidad.

/** La transición pedida no existe en la máquina de estados (o no se cumple su condición). */
export class TransicionInvalida extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = 'TransicionInvalida'
  }
}

/** Se intentó iniciar el pago en un período que ya cerró (FR-011). */
export class PeriodoCerrado extends Error {
  constructor(mensaje = 'El período de ingreso está cerrado.') {
    super(mensaje)
    this.name = 'PeriodoCerrado'
  }
}

/** Se intentó iniciar el pago en un período sin cupos libres (FR-011). */
export class SinCuposParaIniciar extends Error {
  constructor(mensaje = 'El período no tiene cupos libres.') {
    super(mensaje)
    this.name = 'SinCuposParaIniciar'
  }
}

/** Se intentó bajar `totalCupos` por debajo de las vacantes ya confirmadas. */
export class CuposPorDebajoDeConfirmadas extends Error {
  constructor(mensaje = 'El total de cupos no puede ser menor a las vacantes ya confirmadas.') {
    super(mensaje)
    this.name = 'CuposPorDebajoDeConfirmadas'
  }
}
