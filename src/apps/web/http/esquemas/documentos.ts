import { z } from 'zod'
import { TIPOS_DE_DOCUMENTO } from '@tfi/domain'

/** `GET /api/documentos` */
export const esquemaFiltrosDeDocumento = z.object({
  postulacionId: z.string().uuid('La Postulación no es válida').optional(),
  estado: z.enum(['PENDIENTE', 'APROBADO', 'OBSERVADO']).optional(),
  tipo: z.enum(TIPOS_DE_DOCUMENTO).optional(),
})

/** `POST /api/documentos` (multipart/form-data) */
export const esquemaSubidaDeDocumento = z.object({
  postulacionId: z.string().uuid('La Postulación no es válida'),
  tipo: z.enum(TIPOS_DE_DOCUMENTO),
  vigencia: z.coerce
    .number()
    .int()
    .min(0, 'La vigencia no puede ser negativa')
    .max(3650, 'La vigencia no puede superar los 10 años')
    .default(365),
  archivo: z.instanceof(File, { message: 'Falta el archivo' }),
})

/** `PATCH /api/documentos/:id` cuando se revisa el estado. */
export const esquemaRevisionDeDocumento = z
  .object({
    estado: z.enum(['PENDIENTE', 'APROBADO', 'OBSERVADO']),
    observaciones: z.string().trim().max(1000).nullable().optional(),
  })
  .refine(
    (datos) =>
      datos.estado !== 'OBSERVADO' ||
      (datos.observaciones !== undefined &&
        datos.observaciones !== null &&
        datos.observaciones.length > 0),
    { message: 'Para observar un documento hay que indicar el motivo', path: ['observaciones'] },
  )

/** `PATCH /api/documentos/:id` para corregir metadatos. */
export const esquemaCambiosDeDocumento = z
  .object({
    tipo: z.enum(TIPOS_DE_DOCUMENTO).optional(),
    vigencia: z.coerce.number().int().min(0).max(3650).optional(),
    nombreArchivo: z.string().trim().min(1).max(255).optional(),
  })
  .refine((datos) => Object.keys(datos).length > 0, {
    message: 'No hay cambios para aplicar',
  })

/** `GET|PATCH|DELETE /api/documentos/:id` */
export const esquemaParametrosDeDocumento = z.object({
  id: z.string().uuid('El documento no es válido'),
})
