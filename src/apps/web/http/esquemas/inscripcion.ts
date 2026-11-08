import { z } from 'zod'
import { detallesDeZod } from './errores'
import { esquemaRegistro, type DatosRegistroHttp } from './registro'

const SEXO_POR_GENERO: Record<string, 'M' | 'F' | 'O'> = {
  Masculino: 'M',
  Femenino: 'F',
  'No binario / Otro': 'O',
}

/** Lo que carga el formulario de inscripción, tal como llega. */
export interface DatosDeInscripcion {
  nombre: string
  apellido: string
  email: string
  password: string
  confirmarPassword: string
  dni: string
  cuil: string
  fechaNacimiento: string
  genero: string
  telefono: string
  direccion: string
  aceptaTerminosFacturacion: boolean
  aceptaReglamento: boolean
}

export type ResultadoDeValidacion =
  | { ok: true; datos: DatosRegistroHttp }
  | { ok: false; errores: Record<string, string> }

// Lo propio de este formulario. Los datos de la cuenta los valida esquemaRegistro, igual que en /registro.
const esquemaDelFormulario = z.object({
  genero: z.enum(['Masculino', 'Femenino', 'No binario / Otro'], {
    errorMap: () => ({ message: 'Seleccioná una opción de género' }),
  }),
  confirmarPassword: z.string().min(1, 'Confirmá tu contraseña'),
  telefono: z
    .string()
    .trim()
    .min(8, 'Ingresá un número de teléfono celular válido')
    .regex(/^[0-9\s-]+$/, 'Formato de teléfono inválido'),
  direccion: z.string().trim().min(5, 'Ingresá calle, altura, piso/dpto y localidad'),
  aceptaTerminosFacturacion: z.literal(true, {
    errorMap: () => ({ message: 'Debés aceptar la declaración jurada' }),
  }),
  aceptaReglamento: z.literal(true, {
    errorMap: () => ({ message: 'Debés confirmar la lectura de las condiciones' }),
  }),
})

/** Los errores del registro, con los nombres de los campos de este formulario. */
function erroresDelRegistro(errores: Record<string, string>): Record<string, string> {
  const { contrasena, ...resto } = errores
  delete resto.sexo
  return contrasena === undefined ? resto : { ...resto, password: contrasena }
}

export function validarInscripcion(datos: DatosDeInscripcion): ResultadoDeValidacion {
  const formulario = esquemaDelFormulario.safeParse(datos)
  const registro = esquemaRegistro.safeParse({
    email: datos.email,
    contrasena: datos.password,
    nombre: datos.nombre,
    apellido: datos.apellido,
    dni: datos.dni,
    cuil: datos.cuil,
    fechaNacimiento: datos.fechaNacimiento,
    sexo: SEXO_POR_GENERO[datos.genero],
    telefono: datos.telefono,
    direccion: datos.direccion,
  })

  const errores: Record<string, string> = {
    ...(registro.success ? {} : erroresDelRegistro(detallesDeZod(registro.error))),
    ...(formulario.success ? {} : detallesDeZod(formulario.error)),
  }
  if (!errores.confirmarPassword && datos.password !== datos.confirmarPassword) {
    errores.confirmarPassword = 'Las contraseñas no coinciden'
  }

  if (!registro.success || Object.keys(errores).length > 0) {
    return { ok: false, errores }
  }
  return { ok: true, datos: registro.data }
}
