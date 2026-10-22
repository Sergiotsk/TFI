import { ESTADOS_DE_POSTULACION } from '@tfi/domain'
import { z } from 'zod'

export const esquemaCrearPostulacion = z.object({
  periodoId: z.string().uuid('El período no es válido'),
})

export const esquemaParametrosDePostulacion = z.object({
  id: z.string().uuid('La Postulación no es válida'),
})

/** Filtros de `GET /api/postulaciones` (personal). Todos son opcionales. */
export const esquemaFiltrosDePostulacion = z.object({
  aspiranteId: z.string().uuid('El perfil no es válido').optional(),
  periodoId: z.string().uuid('El período no es válido').optional(),
  estado: z.enum(ESTADOS_DE_POSTULACION, {
    errorMap: () => ({ message: 'El estado no es válido' }),
  }).optional(),
})
