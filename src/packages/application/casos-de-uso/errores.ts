/**
 * Errores de la capa de aplicación: los que un caso de uso tira cuando la
 * operación no se puede hacer por quien la pide o por el estado de los datos.
 */
export class NoAutorizado extends Error {
  constructor(mensaje = 'No autorizado') {
    super(mensaje)
    this.name = 'NoAutorizado'
  }
}

/** El recurso que pidió el caso de uso no existe. */
export class NoEncontrado extends Error {
  constructor(mensaje = 'No encontrado') {
    super(mensaje)
    this.name = 'NoEncontrado'
  }
}

/** Otro proceso movió el estado antes de que este pudiera guardar. */
export class ConflictoDeEstado extends Error {
  constructor(mensaje = 'La Postulación cambió de estado mientras tanto') {
    super(mensaje)
    this.name = 'ConflictoDeEstado'
  }
}
