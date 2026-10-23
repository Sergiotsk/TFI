import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { esquemaParametrosDePeriodo } from '@/http/esquemas/periodos'
import { respuestaDeErrorDePostulacion } from '@/http/errores'
import { jsonError, jsonOk } from '@/http/respuesta'

/**
 * `GET /api/periodos/:id/ocupacion` → `ConsultarOcupacion` (US3).
 *
 * Solo el personal. Devuelve el total de cupos, las vacantes confirmadas, los
 * pagos pendientes vigentes y los cupos libres. La ocupación se deriva de las
 * Postulaciones: no hay contador que se pueda desincronizar.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const parametros = esquemaParametrosDePeriodo.safeParse(await params)

  if (!parametros.success) {
    return jsonError('DATOS_INVALIDOS', 'Los datos ingresados no son válidos', 400, {
      id: parametros.error.issues[0]?.message ?? 'Dato inválido',
    })
  }

  const supabase = await crearCliente()
  const { obtenerActorUseCase, consultarOcupacion } = crearDependencias(supabase)

  const actor = await obtenerActorUseCase.ejecutar()

  if (actor.resultado === 'SIN_SESION') {
    return jsonError('NO_AUTENTICADO', 'No autenticado', 401)
  }

  if (actor.resultado === 'SIN_PERFIL') {
    return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)
  }

  try {
    const ocupacion = await consultarOcupacion.ejecutar(actor.actor, parametros.data.id)

    return jsonOk(ocupacion)
  } catch (error) {
    return respuestaDeErrorDePostulacion(error)
  }
}
