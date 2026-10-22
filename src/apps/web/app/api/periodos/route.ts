import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { esquemaCrearPeriodo } from '@/http/esquemas/periodos'
import { detallesDeZod } from '@/http/esquemas/errores'
import { respuestaDeErrorDePostulacion } from '@/http/errores'
import { jsonError, jsonOk } from '@/http/respuesta'

/**
 * `GET /api/periodos` → `ListarPeriodosAbiertos` (US3).
 *
 * Los períodos abiertos de la institución del actor. Los usa el aspirante para
 * elegir dónde postularse y el personal para operar.
 */
export async function GET() {
  const supabase = await crearCliente()
  const { obtenerActorUseCase, listarPeriodosAbiertos } = crearDependencias(supabase)

  const actor = await obtenerActorUseCase.ejecutar()

  if (actor.resultado === 'SIN_SESION') {
    return jsonError('NO_AUTENTICADO', 'No autenticado', 401)
  }

  if (actor.resultado === 'SIN_PERFIL') {
    return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)
  }

  const periodos = await listarPeriodosAbiertos.ejecutar(actor.actor)

  return jsonOk(periodos)
}

/**
 * `POST /api/periodos` → `CrearPeriodo` (US3).
 *
 * Solo `SECRETARIA` y `DIRECCION` (FR-008). La institución y el id los decide
 * el caso de uso; el body solo trae los datos del período.
 */
export async function POST(request: Request) {
  const cuerpo: unknown = await request.json().catch(() => null)
  const parsed = esquemaCrearPeriodo.safeParse(cuerpo)

  if (!parsed.success) {
    return jsonError(
      'DATOS_INVALIDOS',
      'Los datos ingresados no son válidos',
      400,
      detallesDeZod(parsed.error),
    )
  }

  const supabase = await crearCliente()
  const { obtenerActorUseCase, crearPeriodo } = crearDependencias(supabase)

  const actor = await obtenerActorUseCase.ejecutar()

  if (actor.resultado === 'SIN_SESION') {
    return jsonError('NO_AUTENTICADO', 'No autenticado', 401)
  }

  if (actor.resultado === 'SIN_PERFIL') {
    return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)
  }

  try {
    const periodo = await crearPeriodo.ejecutar(actor.actor, parsed.data)

    return jsonOk(periodo, 201)
  } catch (error) {
    return respuestaDeErrorDePostulacion(error)
  }
}
