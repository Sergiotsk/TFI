import { NoAutorizado } from '@tfi/application'
import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { esquemaCambioDeContrasena } from '@/http/esquemas/recuperacion'
import { detallesDeZod } from '@/http/esquemas/errores'
import { respuestaDeErrorDePostulacion } from '@/http/errores'
import { jsonError, jsonOk } from '@/http/respuesta'

/**
 * `POST /api/auth/cambiar-contrasena` → `CambiarContrasena`.
 *
 * Cambia la contraseña de la cuenta con la sesión abierta: la abre el enlace
 * del email o un inicio de sesión normal. Sin sesión responde 401 y no acepta
 * un email ni un id de cuenta, así que no puede tocar otra cuenta.
 */
export async function POST(request: Request) {
  const body: unknown = await request.json()
  const parsed = esquemaCambioDeContrasena.safeParse(body)

  if (!parsed.success) {
    return jsonError(
      'DATOS_INVALIDOS',
      'Los datos ingresados no son válidos',
      400,
      detallesDeZod(parsed.error),
    )
  }

  const supabase = await crearCliente()
  const { cambiarContrasena } = crearDependencias(supabase)

  try {
    await cambiarContrasena.ejecutar(parsed.data.contrasena)
    return jsonOk({ mensaje: 'Contraseña actualizada' })
  } catch (error) {
    if (error instanceof NoAutorizado) {
      return jsonError('NO_AUTENTICADO', error.message, 401)
    }
    return respuestaDeErrorDePostulacion(error)
  }
}
