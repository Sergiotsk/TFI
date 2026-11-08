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

/** Ya existe otro perfil con el mismo DNI o CUIL (restricción UNIQUE). */
export class DatosDuplicados extends Error {
  constructor(mensaje = 'Ya existe un perfil con ese DNI o CUIL') {
    super(mensaje)
    this.name = 'DatosDuplicados'
  }
}

/** Los datos de la solicitud no cumplen una regla de negocio (no es un 500). */
export class SolicitudInvalida extends Error {
  constructor(mensaje = 'Los datos de la solicitud no son válidos') {
    super(mensaje)
    this.name = 'SolicitudInvalida'
  }
}
