import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { esquemaSolicitudDeRecuperacion } from '@/http/esquemas/recuperacion'
import { detallesDeZod } from '@/http/esquemas/errores'
import { jsonError, jsonOk } from '@/http/respuesta'

/**
 * La misma respuesta exista o no la cuenta: el endpoint es público y no puede
 * servir para averiguar qué emails están registrados.
 */
const MENSAJE_GENERICO =
  'Si el email está registrado, te enviamos un enlace para elegir una contraseña nueva.'

/**
 * `POST /api/auth/recuperar-contrasena` → `SolicitarRecuperacionDeContrasena`.
 *
 * Manda el email con el enlace (Supabase Auth + SMTP del proyecto). El 503 es
 * solo para una falla real de envío, no para un email que no existe.
 */
export async function POST(request: Request) {
  const body: unknown = await request.json()
  const parsed = esquemaSolicitudDeRecuperacion.safeParse(body)

  if (!parsed.success) {
    return jsonError(
      'DATOS_INVALIDOS',
      'Los datos ingresados no son válidos',
      400,
      detallesDeZod(parsed.error),
    )
  }

  const supabase = await crearCliente()
  const { solicitarRecuperacionDeContrasena } = crearDependencias(supabase)
  const resultado = await solicitarRecuperacionDeContrasena.ejecutar(parsed.data.email)

  if (resultado.resultado === 'NO_ENVIADO') {
    return jsonError(
      'ENVIO_FALLIDO',
      'No pudimos enviar el email. Probá de nuevo en unos minutos.',
      503,
    )
  }

  return jsonOk({ mensaje: MENSAJE_GENERICO })
}
