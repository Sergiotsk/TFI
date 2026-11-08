import { z } from 'zod'

export const esquemaInicioDeSesion = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, 'Ingresá tu email')
      .email('El email no tiene un formato válido')
      .max(255, 'El email es demasiado largo'),
    contrasena: z.string().min(1, 'Ingresá tu contraseña'),
  })
  .strict()

export type DatosInicioDeSesionHttp = z.infer<typeof esquemaInicioDeSesion>
