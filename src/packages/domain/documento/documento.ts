import type { EstadoDocumento } from './estado'

/**
 * Un documento de una Postulación.
 *
 * La documentación se revisa después de que el pago acredite la vacante: es el
 * estado `ESPERANDO_DOCUMENTACION` del ciclo de vida de la Postulación.
 */
export class Documento {
  constructor(
    readonly id: string,
    readonly postulacionId: string,
    readonly ruta: string,
    readonly vigencia: number,
    readonly estado: EstadoDocumento,
  ) {}
}
