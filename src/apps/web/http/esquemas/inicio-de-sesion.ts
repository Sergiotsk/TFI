import { z } from 'zod'

export const esquemaInicioDeSesion = z
  .object({
    email: z.string().email().max(255),
    contrasena: z.string().min(1),
  })
  .strict()

export type DatosInicioDeSesionHttp = z.infer<typeof esquemaInicioDeSesion>
