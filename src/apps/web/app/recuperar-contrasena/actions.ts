'use server'

import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { esquemaSolicitudDeRecuperacion } from '@/http/esquemas/recuperacion'
import { detallesDeZod } from '@/http/esquemas/errores'
import { textoDelCampo } from '@/lib/form-data'

export type EstadoDeRecuperacion = {
  mensaje?: string
  /** El mensaje de éxito no es un error: se muestra distinto. */
  tono?: 'ok' | 'error'
  errores?: Record<string, string>
}

/**
 * La misma respuesta exista o no la cuenta: no se puede usar el formulario
 * para averiguar qué emails están registrados.
 */
const MENSAJE_GENERICO =
  'Si el email está registrado, te enviamos un enlace para elegir una contraseña nueva. Revisá tu casilla y la carpeta de spam.'

export async function solicitarRecuperacion(
  _estado: EstadoDeRecuperacion,
  datos: FormData,
): Promise<EstadoDeRecuperacion> {
  const parsed = esquemaSolicitudDeRecuperacion.safeParse({
    email: textoDelCampo(datos, 'email'),
  })

  if (!parsed.success) {
    return {
      mensaje: 'Revisá los datos marcados',
      tono: 'error',
      errores: detallesDeZod(parsed.error),
    }
  }

  const supabase = await crearCliente()
  const { solicitarRecuperacionDeContrasena } = crearDependencias(supabase)
  const resultado = await solicitarRecuperacionDeContrasena.ejecutar(parsed.data.email)

  if (resultado.resultado === 'NO_ENVIADO') {
    return {
      mensaje: 'No pudimos enviar el email. Probá de nuevo en unos minutos.',
      tono: 'error',
    }
  }

  return { mensaje: MENSAJE_GENERICO, tono: 'ok' }
}
