import { z } from 'zod'
import {
  LONGITUD_MAXIMA_DE_CONTRASENA,
  LONGITUD_MINIMA_DE_CONTRASENA,
} from '@tfi/application'

const email = z
  .string()
  .trim()
  .min(1, 'Ingresá tu email')
  .email('El email no tiene un formato válido')
  .max(255, 'El email es demasiado largo')

/** `POST /api/auth/recuperar-contrasena`: solo el email al que mandar el enlace. */
export const esquemaSolicitudDeRecuperacion = z.object({ email }).strict()

/**
 * Elegir la contraseña nueva: se pide dos veces y se exige que coincidan. El
 * largo es el mismo que valida el caso de uso (`politica-de-contrasena`), acá
 * solo para marcar el campo sin viajar al servidor.
 */
export const esquemaCambioDeContrasena = z
  .object({
    contrasena: z
      .string()
      .min(
        LONGITUD_MINIMA_DE_CONTRASENA,
        `La contraseña debe tener al menos ${LONGITUD_MINIMA_DE_CONTRASENA} caracteres`,
      )
      .max(LONGITUD_MAXIMA_DE_CONTRASENA, 'La contraseña es demasiado larga'),
    confirmacion: z.string().min(1, 'Repetí la contraseña'),
  })
  .strict()
  .refine((datos) => datos.contrasena === datos.confirmacion, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmacion'],
  })

export type DatosDeSolicitudDeRecuperacion = z.infer<typeof esquemaSolicitudDeRecuperacion>
export type DatosDeCambioDeContrasena = z.infer<typeof esquemaCambioDeContrasena>
