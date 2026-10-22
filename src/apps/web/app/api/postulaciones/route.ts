import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { esquemaCrearPostulacion } from '@/http/esquemas/postulaciones'
import { respuestaDeErrorDePostulacion } from '@/http/errores'
import { jsonError, jsonOk } from '@/http/respuesta'

/**
 * `POST /api/postulaciones` `{ periodoId }` → `CrearPostulacion` (US2).
 *
 * Crea la Postulación del aspirante autenticado en un período abierto. El
 * route handler solo valida el borde: la autorización, el período y la
 * duplicada los decide el caso de uso y el dominio.
 */
export async function POST(request: Request) {
  const cuerpo: unknown = await request.json().catch(() => null)
  const parsed = esquemaCrearPostulacion.safeParse(cuerpo)

  if (!parsed.success) {
    return jsonError('DATOS_INVALIDOS', 'Los datos ingresados no son válidos', 400, {
      periodoId: parsed.error.issues[0]?.message ?? 'Dato inválido',
    })
  }

  const supabase = await crearCliente()
  const { obtenerActorUseCase, crearPostulacion } = crearDependencias(supabase)

  const actor = await obtenerActorUseCase.ejecutar()

  if (actor.resultado === 'SIN_SESION') {
    return jsonError('NO_AUTENTICADO', 'No autenticado', 401)
  }

  if (actor.resultado === 'SIN_PERFIL') {
    return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)
  }

  try {
    const creada = await crearPostulacion.ejecutar(actor.actor, parsed.data.periodoId)

    return jsonOk(creada, 201)
  } catch (error) {
    return respuestaDeErrorDePostulacion(error)
  }
}
