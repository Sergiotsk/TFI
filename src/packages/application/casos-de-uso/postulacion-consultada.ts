import type { EstadoPostulacion, MotivoRevision, Postulacion } from '@tfi/domain'

/** Lo que ve el aspirante (o el personal) de una Postulación. */
export interface PostulacionConsultada {
  id: string
  /** El número legible, con ceros a la izquierda. */
  numero: string
  /** El estado efectivo: una `PAGO_PENDIENTE` vencida se informa `VENCIDO`. */
  estado: EstadoPostulacion
  venceEl: Date | null
  motivoRevision: MotivoRevision | null
  aviso: string | null
}

const AVISO_LUGAR_NO_RESERVADO = 'Tu lugar no está reservado hasta que se acredite el pago.'
const AVISO_PAGO_EN_REVISION = 'Tu pago está en revisión.'

export function aPostulacionConsultada(
  postulacion: Postulacion,
  ahora: Date,
): PostulacionConsultada {
  const estado = postulacion.estadoEn(ahora)

  return {
    id: postulacion.id,
    numero: postulacion.numero.formatear(),
    estado,
    venceEl: postulacion.venceEl,
    motivoRevision: postulacion.motivoRevision,
    aviso: avisoDe(estado),
  }
}

/** FR-007: el aviso depende del estado efectivo, no del persistido. */
function avisoDe(estado: EstadoPostulacion): string | null {
  if (estado === 'PAGO_PENDIENTE') return AVISO_LUGAR_NO_RESERVADO
  if (estado === 'PAGO_EN_REVISION') return AVISO_PAGO_EN_REVISION

  return null
}
