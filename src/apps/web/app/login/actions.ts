'use server'

import { redirect } from 'next/navigation'
import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { esquemaInicioDeSesion } from '@/http/esquemas/inicio-de-sesion'
import { detallesDeZod } from '@/http/esquemas/errores'
import { textoDelCampo } from '@/lib/form-data'
import { destinoSeguro } from '@/lib/redireccion'

export type EstadoDeFormulario = {
  mensaje?: string
  errores?: Record<string, string>
}

export async function iniciarSesion(
  _estado: EstadoDeFormulario,
  datos: FormData,
): Promise<EstadoDeFormulario> {
  const parsed = esquemaInicioDeSesion.safeParse({
    email: textoDelCampo(datos, 'email'),
    contrasena: textoDelCampo(datos, 'contrasena'),
  })

  if (!parsed.success) {
    return {
      mensaje: 'Revisá los datos marcados',
      errores: detallesDeZod(parsed.error),
    }
  }

  const supabase = await crearCliente()
  const { iniciarSesion: casoDeInicioDeSesion } = crearDependencias(supabase)
  const resultado = await casoDeInicioDeSesion.ejecutar(
    parsed.data.email,
    parsed.data.contrasena,
  )

  if (resultado.resultado === 'CREDENCIALES_INVALIDAS') {
    // Mensaje generico: no revelamos si el email existe.
    return { mensaje: 'Email o contraseña incorrectos' }
  }

  redirect(destinoSeguro(textoDelCampo(datos, 'redirect'), '/panel'))
}
