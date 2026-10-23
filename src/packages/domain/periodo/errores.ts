/** El período no cumple una regla de negocio (por ejemplo, cerrar en el pasado). */
export class PeriodoInvalido extends Error {
  constructor(mensaje = 'El período de ingreso no es válido') {
    super(mensaje)
    this.name = 'PeriodoInvalido'
  }
}

/** Ya existe un período con ese nombre en la institución. */
export class PeriodoDuplicado extends Error {
  constructor(readonly nombre: string) {
    super('Ya existe un período de ingreso con ese nombre en la institución')
    this.name = 'PeriodoDuplicado'
  }
}
