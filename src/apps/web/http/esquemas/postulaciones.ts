import { z } from 'zod'

export const esquemaCrearPostulacion = z.object({
  periodoId: z.string().uuid('El período no es válido'),
})

export const esquemaParametrosDePostulacion = z.object({
  id: z.string().uuid('La Postulación no es válida'),
})
