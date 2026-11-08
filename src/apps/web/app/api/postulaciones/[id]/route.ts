import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { esquemaParametrosDePostulacion } from '@/http/esquemas/postulaciones'
import { respuestaDeErrorDePostulacion } from '@/http/errores'
import { jsonError, jsonOk } from '@/http/respuesta'

/**
 * `GET /api/postulaciones/:id` → `ConsultarPostulacion` (US2).
 *
 * La puede ver el propio aspirante o cualquier rol del personal; la
 * autorización la decide el caso de uso, no la ruta.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const parsed = esquemaParametrosDePostulacion.safeParse(await params)

  if (!parsed.success) {
    return jsonError('DATOS_INVALIDOS', 'Los datos ingresados no son válidos', 400, {
      id: parsed.error.issues[0]?.message ?? 'Dato inválido',
    })
  }

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
    const postulacion = await consultarPostulacion.ejecutar(actor.actor, parsed.data.id)

    if (!postulacion) {
      return jsonError('NO_ENCONTRADO', 'La Postulación no existe', 404)
    }

    return jsonOk(postulacion)
  } catch (error) {
    return respuestaDeErrorDePostulacion(error)
  }
}
