import { z } from 'zod'

const DNI_REGEX = /^[0-9]{7,8}$/
const CUIL_REGEX = /^[0-9]{11}$/

function soloDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

const dni = z
  .string()
  .transform(soloDigitos)
  .pipe(z.string().regex(DNI_REGEX, 'El DNI debe tener 7 u 8 dígitos'))

/** Campos personales que el propio usuario puede corregir (sin DNI). */
const camposDePerfilPropio = {
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  apellido: z.string().trim().min(1, 'El apellido es obligatorio').max(100),
  cuil: z
    .string()
    .transform(soloDigitos)
    .pipe(z.string().regex(CUIL_REGEX, 'El CUIL debe tener 11 dígitos')),
  fechaNacimiento: z.coerce.date().refine((fecha) => fecha.getTime() < Date.now(), {
    message: 'La fecha de nacimiento debe ser anterior a hoy',
  }),
  sexo: z.enum(['M', 'F', 'O'], {
    errorMap: () => ({ message: 'El sexo no es válido' }),
  }),
  telefono: z.string().trim().max(30, 'El teléfono es demasiado largo').nullable(),
  direccion: z.string().trim().max(500, 'La dirección es demasiado larga').nullable(),
}

/** `POST /api/postulaciones/:id/prorrogar-plazo` */
export const esquemaProrrogaDePlazo = z.object({
  dias: z.coerce
    .number()
    .int()
    .min(1, 'La prórroga debe ser de al menos un día')
    .max(365, 'La prórroga no puede superar los 365 días'),
})

/** `PATCH /api/perfiles/:id`: el personal también puede corregir el DNI. */
export const esquemaActualizarPerfil = z
  .object({ ...camposDePerfilPropio, dni })
  .partial()
  .refine((datos) => Object.keys(datos).length > 0, {
    message: 'No hay cambios para aplicar',
  })

/** `PATCH /api/perfiles/mio`: el DNI no se puede cambiar. */
export const esquemaActualizarPerfilPropio = z
  .object(camposDePerfilPropio)
  .partial()
  .refine((datos) => Object.keys(datos).length > 0, {
    message: 'No hay cambios para aplicar',
  })

/** `PATCH /api/perfiles/:id` */
export const esquemaParametrosDePerfil = z.object({
  id: z.string().uuid('El perfil no es válido'),
})
