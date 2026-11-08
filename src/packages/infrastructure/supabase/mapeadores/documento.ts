import { z } from 'zod'
import { Documento, TIPOS_DE_DOCUMENTO } from '@tfi/domain'
import type { TipoDeDocumento } from '@tfi/domain'

const esquemaFilaDeDocumento = z.object({
  id: z.string().uuid(),
  postulacion_id: z.string().uuid(),
  tipo: z.string(),
  ruta: z.string(),
  nombre_archivo: z.string(),
  mime_type: z.string(),
  tamanio_bytes: z.coerce.number().int().nonnegative(),
  vigencia: z.coerce.number().int().nonnegative(),
  estado: z.enum(['PENDIENTE', 'APROBADO', 'OBSERVADO']),
  subido_por: z.string().uuid().nullable(),
  revisado_por: z.string().uuid().nullable(),
  revisado_el: z.string().nullable(),
  observaciones: z.string().nullable(),
  creado_el: z.string(),
  actualizado_el: z.string(),
})

function tipoDeDocumento(valor: string): TipoDeDocumento {
  return (TIPOS_DE_DOCUMENTO as readonly string[]).includes(valor)
    ? (valor as TipoDeDocumento)
    : 'OTRO'
}

export function mapearDocumento(fila: unknown): Documento {
  const datos = esquemaFilaDeDocumento.parse(fila)

  return new Documento(
    datos.id,
    datos.postulacion_id,
    tipoDeDocumento(datos.tipo),
    datos.ruta,
    datos.nombre_archivo,
    datos.mime_type,
    datos.tamanio_bytes,
    datos.vigencia,
    datos.estado,
    datos.subido_por,
    datos.revisado_por,
    datos.revisado_el === null ? null : new Date(datos.revisado_el),
    datos.observaciones,
    new Date(datos.creado_el),
    new Date(datos.actualizado_el),
  )
}
