import type { EstadoPostulacion } from './estadoPostulacion'
import type { MotivoRevision } from './motivoRevision'

export class Postulacion {
  constructor(
    readonly id: string,
    readonly aspiranteId: string,
    readonly estado: EstadoPostulacion,
    readonly creadoEl: Date,
    readonly actualizadoEl: Date,
    readonly periodoId: string,
    readonly numero: number | null,
    readonly venceEl: Date,
    readonly motivo_revision: MotivoRevision | null,
  ) {}
}
