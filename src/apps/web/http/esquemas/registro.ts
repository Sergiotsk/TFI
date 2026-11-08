import { z } from 'zod'

const DNI_REGEX = /^[0-9]{7,8}$/
const CUIL_REGEX = /^[0-9]{11}$/
const TELEFONO_REGEX = /^[0-9+\-\s()]{0,30}$/
const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}(T.*)?$/

function normalizarDni(valor: string): string {
  return valor.replace(/\D/g, '')
}

function normalizarCuil(valor: string): string {
  return valor.replace(/\D/g, '')
}

export const esquemaRegistro = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, 'Ingresá tu email')
      .email('El email no tiene un formato válido')
      .max(255, 'El email es demasiado largo'),
    contrasena: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(72, 'La contraseña es demasiado larga'),
    nombre: z.string().trim().min(1, 'Ingresá tu nombre').max(100, 'El nombre es demasiado largo'),
    apellido: z.string().trim().min(1, 'Ingresá tu apellido').max(100, 'El apellido es demasiado largo'),
    dni: z
      .string()
      .transform(normalizarDni)
      .pipe(z.string().regex(DNI_REGEX, 'El DNI debe tener 7 u 8 dígitos')),
    cuil: z
      .string()
      .transform(normalizarCuil)
      .pipe(z.string().regex(CUIL_REGEX, 'El CUIL debe tener 11 dígitos')),
    fechaNacimiento: z
      .string()
      .trim()
      .regex(FECHA_REGEX, 'La fecha de nacimiento debe tener el formato AAAA-MM-DD')
      // `split` puede devolver undefined con noUncheckedIndexedAccess: el `??`
      // deja la fecha como vino si no hay separador.
      .transform((valor) => (valor.includes('T') ? (valor.split('T')[0] ?? valor) : valor)),
    sexo: z.enum(['M', 'F', 'O'], {
      errorMap: () => ({ message: 'Seleccioná el sexo' }),
    }),
    telefono: z
      .string()
      .trim()
      .max(30, 'El teléfono es demasiado largo')
      .regex(TELEFONO_REGEX, 'El teléfono no tiene un formato válido')
      .optional()
      .transform((valor) => (valor && valor.trim() === '' ? undefined : valor?.trim())),
    direccion: z
      .string()
      .trim()
      .max(500, 'La dirección es demasiado larga')
      .optional()
      .transform((valor) => (valor && valor.trim() === '' ? undefined : valor?.trim())),
  })
  .strict() // descarta claves desconocidas, nunca passthrough()

export type DatosRegistroHttp = z.infer<typeof esquemaRegistro>
