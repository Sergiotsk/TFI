import { z } from 'zod'
import { CLAVES_DE_ASUNTOS } from '@/lib/landing/datos'

/** Equivalente al FILTER_VALIDATE_EMAIL del prototipo PHP. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Formulario de contacto de la landing: lo que el navegador envía a POST /api/contacto.
 * Los mensajes replican a los del backend PHP para que la experiencia sea la misma.
 */
export const schemaDeConsultaDeContacto = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, { message: 'Escribí tu nombre (entre 2 y 100 caracteres).' })
    .max(100, { message: 'Escribí tu nombre (entre 2 y 100 caracteres).' }),
  email: z
    .string()
    .trim()
    .max(254, { message: 'Ingresá un email válido.' })
    .regex(EMAIL, { message: 'Ingresá un email válido.' }),
  asunto: z.enum(CLAVES_DE_ASUNTOS, { message: 'Elegí un motivo de consulta.' }),
  mensaje: z
    .string()
    .trim()
    .min(10, { message: 'El mensaje debe tener entre 10 y 2000 caracteres.' })
    .max(2000, { message: 'El mensaje debe tener entre 10 y 2000 caracteres.' }),
})

export type ConsultaDeContacto = z.infer<typeof schemaDeConsultaDeContacto>

/** Campo trampa para bots: está oculto en el formulario y las personas nunca lo completan. */
export const CAMPO_TRAMPA = 'sitio_web'
