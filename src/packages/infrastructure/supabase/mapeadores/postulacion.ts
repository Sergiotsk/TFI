import { z } from 'zod'
import { ESTADOS_DE_POSTULACION, NumeroDePostulacion, Postulacion } from '@tfi/domain'

// La fila de PostgREST, validada en el borde (Zod solo en infrastructure).
const esquemaFilaDePostulacion = z.object({
  id: z.string().uuid(),
  aspirante_id: z.string().uuid(),
  periodo_id: z.string().uuid(),
  numero: z.number().int().positive(),
  estado: z.enum(ESTADOS_DE_POSTULACION),
  vence_el: z.string().nullable(),
  motivo_revision: z.enum(['FUERA_DE_PLAZO', 'SIN_CUPO']).nullable(),
  creado_el: z.string(),
  actualizado_el: z.string(),
})

export function mapearPostulacion(fila: unknown): Postulacion {
  const datos = esquemaFilaDePostulacion.parse(fila)

  return new Postulacion(
    datos.id,
    NumeroDePostulacion.desde(datos.numero),
    datos.aspirante_id,
    datos.periodo_id,
    datos.estado,
    datos.vence_el === null ? null : new Date(datos.vence_el),
    datos.motivo_revision,
    new Date(datos.creado_el),
    new Date(datos.actualizado_el),
  )
}
