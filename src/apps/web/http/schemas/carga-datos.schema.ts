// src/apps/web/http/schemas/carga-datos.schema.ts
import { z } from 'zod'

export const CargaDatosSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'Nombre demasiado largo'),
  apellido: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(100, 'Apellido demasiado largo'),
  email: z
    .string()
    .email('Ingresá un correo electrónico válido'),
  dni: z
    .string()
    .regex(/^\d{7,8}$/, 'El DNI debe contener 7 u 8 dígitos numéricos sin puntos'),
  genero: z
    .enum(['Masculino', 'Femenino', 'No binario / Otro'], {
      errorMap: () => ({ message: 'Seleccioná una opción de género' }),
    }),
  telefono: z
    .string()
    .min(8, 'Ingresá un número de teléfono celular válido')
    .regex(/^[0-9\s-]+$/, 'Formato de teléfono inválido'),
  direccion: z
    .string()
    .min(5, 'Ingresá calle, altura, piso/dpto y localidad'),
  aceptaTerminosFacturacion: z
    .literal(true, {
      errorMap: () => ({ message: 'Debés aceptar la declaración jurada' }),
    }),
  aceptaReglamento: z
    .literal(true, {
      errorMap: () => ({ message: 'Debés confirmar la lectura de las condiciones' }),
    }),
})

export type CargaDatosInput = z.infer<typeof CargaDatosSchema>