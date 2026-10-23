import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { respuestaDeErrorDePostulacion } from '@/http/errores'
import { jsonError, jsonOk } from '@/http/respuesta'

/**
 * `GET /api/postulaciones/mias` → `ConsultarPostulacion.listarMias` (US2).
 *
 * Devuelve las Postulaciones del aspirante autenticado, con el estado efectivo
 * (una `PAGO_PENDIENTE` vencida se informa `VENCIDO`) y el aviso de FR-007.
 */
export async function GET() {
  const supabase = await crearCliente()
  const { obtenerActorUseCase, consultarPostulacion } = crearDependencias(supabase)

  const actor = await obtenerActorUseCase.ejecutar()

  if (actor.resultado === 'SIN_SESION') {
    return jsonError('NO_AUTENTICADO', 'No autenticado', 401)
  }

  if (actor.resultado === 'SIN_PERFIL') {
    return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)
  }

  try {
    const mias = await consultarPostulacion.listarMias(actor.actor)

    return jsonOk(mias)
  } catch (error) {
    return respuestaDeErrorDePostulacion(error)
  }
}
