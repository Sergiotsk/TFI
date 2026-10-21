import { z } from 'zod'

const DNI_REGEX = /^[0-9]{7,8}$/
const CUIL_REGEX = /^[0-9]{11}$/
const TELEFONO_REGEX = /^[0-9+\-\s()]{0,30}$/

function normalizarDni(valor: string): string {
  return valor.replace(/\D/g, '')
}

function normalizarCuil(valor: string): string {
  return valor.replace(/\D/g, '')
}

export const esquemaRegistro = z
  .object({
    email: z.string().email().max(255),
    contrasena: z.string().min(8),
    nombre: z.string().trim().min(1).max(100),
    apellido: z.string().trim().min(1).max(100),
    dni: z.string().transform(normalizarDni).pipe(z.string().regex(DNI_REGEX)),
    cuil: z.string().transform(normalizarCuil).pipe(z.string().regex(CUIL_REGEX)),
    fechaNacimiento: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .or(z.string().datetime())
      .transform((v) => (v.includes('T') ? v.split('T')[0] : v)),
    sexo: z.enum(['M', 'F', 'O']),
    telefono: z
      .string()
      .trim()
      .regex(TELEFONO_REGEX)
      .max(30)
      .optional()
      .transform((v) => (v && v.trim() === '' ? undefined : v?.trim())),
    direccion: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((v) => (v && v.trim() === '' ? undefined : v?.trim())),
  })
  .strict() // descarta claves desconocidas, nunca passthrough()

export type DatosRegistroHttp = z.infer<typeof esquemaRegistro>
