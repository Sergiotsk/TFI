import type { EstadoDocumento } from './estado'

/** El documento no puede pasar de un estado a otro. */
export class TransicionDeDocumentoInvalida extends Error {
  constructor(
    readonly desde: EstadoDocumento,
    readonly hacia: EstadoDocumento,
  ) {
    super(`No se puede pasar un documento de ${desde} a ${hacia}`)
    this.name = 'TransicionDeDocumentoInvalida'
  }
}

/** Observar un documento exige explicar qué falta corregir. */
export class ObservacionDeDocumentoRequerida extends Error {
  constructor() {
    super('Para observar un documento hay que indicar el motivo')
    this.name = 'ObservacionDeDocumentoRequerida'
  }
}
