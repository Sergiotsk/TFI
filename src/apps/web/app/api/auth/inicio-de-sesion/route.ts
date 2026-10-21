import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { esquemaInicioDeSesion } from '@/http/esquemas/inicio-de-sesion'
import { detallesDeZod } from '@/http/esquemas/errores'
import { jsonError, jsonOk } from '@/http/respuesta'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = esquemaInicioDeSesion.safeParse(body)

    if (!parsed.success) {
      return jsonError(
        'DATOS_INVALIDOS',
        'Los datos ingresados no son válidos',
        400,
        detallesDeZod(parsed.error),
      )
    }

    const supabase = await crearCliente()
    const { iniciarSesion } = crearDependencias(supabase)
    const resultado = await iniciarSesion.ejecutar(parsed.data.email, parsed.data.contrasena)

    if (resultado.resultado === 'CREDENCIALES_INVALIDAS') {
      // Mensaje genérico: no revelamos si el email existe
      return jsonError('CREDENCIALES_INVALIDAS', 'Email o contraseña incorrectos', 401)
    }

    return jsonOk({ usuarioId: resultado.usuarioId })
  } catch {
    return jsonError('ERROR_INTERNO', 'Ocurrió un error inesperado', 500)
  }
}
