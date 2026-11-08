import type { EstadoDocumento, TipoDeDocumento } from './estado'

/** La Postulación ya tiene un documento activo (no observado) de ese tipo. */
export class DocumentoDuplicado extends Error {
  constructor(readonly tipo: TipoDeDocumento) {
    super(`La Postulación ya tiene un documento de tipo ${tipo} cargado`)
    this.name = 'DocumentoDuplicado'
  }
}

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
