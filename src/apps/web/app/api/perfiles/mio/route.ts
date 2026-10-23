import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { esquemaActualizarPerfilPropio } from '@/http/esquemas/acciones'
import { detallesDeZod } from '@/http/esquemas/errores'
import { respuestaDeErrorDePostulacion } from '@/http/errores'
import { jsonError, jsonOk } from '@/http/respuesta'

/**
 * `GET /api/perfiles/mio` → el perfil completo de la sesión.
 *
 * Sirve para que el aspirante vea sus datos sin conocer su id. Un usuario sin
 * perfil recibe 403 (el trigger de Auth no lo creó o la fila no existe).
 */
export async function GET() {
  const supabase = await crearCliente()
  const { consultarPerfilPropio } = crearDependencias(supabase)

  const perfil = await consultarPerfilPropio.ejecutar()

  if (!perfil) return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)

  return jsonOk(perfil)
}

/**
 * `PATCH /api/perfiles/mio` → `ActualizarPerfilPropio`.
 *
 * Cualquier usuario autenticado corrige sus propios datos personales. El DNI,
 * el email, el rol y la institución no se tocan. La autorización es implícita:
 * el `actor` sale de la sesión y el caso de uso siempre apunta a su propio id.
 */
export async function PATCH(request: Request) {
  const cuerpo: unknown = await request.json().catch(() => null)
  const parsed = esquemaActualizarPerfilPropio.safeParse(cuerpo)

  if (!parsed.success) {
    return jsonError(
      'DATOS_INVALIDOS',
      'Los datos ingresados no son válidos',
      400,
      detallesDeZod(parsed.error),
    )
  }

  const supabase = await crearCliente()
  const { obtenerActorUseCase, actualizarPerfilPropio } = crearDependencias(supabase)

  const actor = await obtenerActorUseCase.ejecutar()

  if (actor.resultado === 'SIN_SESION') {
    return jsonError('NO_AUTENTICADO', 'No autenticado', 401)
  }

  if (actor.resultado === 'SIN_PERFIL') {
    return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)
  }

  try {
    const perfil = await actualizarPerfilPropio.ejecutar(actor.actor, parsed.data)

    return jsonOk(perfil)
  } catch (error) {
    return respuestaDeErrorDePostulacion(error)
  }
}
