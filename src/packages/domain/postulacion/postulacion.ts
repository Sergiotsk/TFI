import type { Estado } from './estado'
import type { MotivoRevision } from './motivoRevision'

export class Postulaciones {
  constructor(
    readonly id: string,
    readonly aspiranteId: string,
    readonly estado: Estado,
    readonly creadoEl: Date,
    readonly actualizadoEl: Date,
    readonly periodoId: string,
    readonly numero: number | null,
    readonly venceEl: Date,
    readonly motivo_revision: MotivoRevision | null,
  ) {}
}
