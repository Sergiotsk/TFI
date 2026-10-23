import { z } from 'zod'

// Filtros de la pantalla de seguimiento (query string). Misma regla de DNI que `GET /api/postulaciones/por-dni`.
export const esquemaBusquedaDeDni = z
  .string()
  .transform((valor) => valor.replace(/\D/g, ''))
  .pipe(z.string().regex(/^[0-9]{7,8}$/, 'El DNI debe tener 7 u 8 dígitos'))

export const esquemaPaginaDeSeguimiento = z.coerce.number().int().min(1).catch(1)
