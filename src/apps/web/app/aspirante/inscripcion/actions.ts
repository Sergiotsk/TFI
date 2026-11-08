'use server'

import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { validarInscripcion, type DatosDeInscripcion } from '@/http/esquemas/inscripcion'

export type ResultadoDeInscripcion =
  | { estado: 'REGISTRADO' }
  | { estado: 'CONFIRMAR_EMAIL' }
  | { estado: 'CON_ERRORES'; errores: Record<string, string> }
  | { estado: 'NO_REGISTRADO'; mensaje: string }

export async function inscribir(datos: DatosDeInscripcion): Promise<ResultadoDeInscripcion> {
  const validacion = validarInscripcion(datos)
  if (!validacion.ok) {
    return { estado: 'CON_ERRORES', errores: validacion.errores }
  }

  const supabase = await crearCliente()
  const { registrarAspirante } = crearDependencias(supabase)
  const { fechaNacimiento, ...cuenta } = validacion.datos
  const { telefono, direccion, ...obligatorios } = cuenta
  const resultado = await registrarAspirante.ejecutar({
    ...obligatorios,
    fechaDeNacimiento: fechaNacimiento,
    ...(telefono !== undefined ? { telefono } : {}),
    ...(direccion !== undefined ? { direccion } : {}),
  })

  if (resultado.resultado !== 'REGISTRADO') {
    // Mensaje genérico: no revelamos si el email o el DNI ya existen.
    return {
      estado: 'NO_REGISTRADO',
      mensaje:
        'No pudimos completar el registro. Revisá tus datos o, si ya tenés una cuenta, iniciá sesión.',
    }
  }

  return { estado: resultado.requiereConfirmarEmail ? 'CONFIRMAR_EMAIL' : 'REGISTRADO' }
}
