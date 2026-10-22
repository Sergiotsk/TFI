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
