import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { esquemaParametrosDePostulacion } from '@/http/esquemas/postulaciones'
import { respuestaDeErrorDePostulacion } from '@/http/errores'
import { jsonError, jsonOk } from '@/http/respuesta'

/**
 * `POST /api/postulaciones/:id/iniciar-pago` → `IniciarPago` (US2).
 *
 * Arranca el plazo de pago del aspirante dueño de la Postulación. Iniciar el
 * pago no reserva el lugar: la respuesta trae la fecha límite y el aviso.
 */
export async function POST(
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
  const { obtenerActorUseCase, iniciarPago } = crearDependencias(supabase)

  const actor = await obtenerActorUseCase.ejecutar()

  if (actor.resultado === 'SIN_SESION') {
    return jsonError('NO_AUTENTICADO', 'No autenticado', 401)
  }

  if (actor.resultado === 'SIN_PERFIL') {
    return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)
  }

  try {
    const iniciada = await iniciarPago.ejecutar(actor.actor, parsed.data.id)

    return jsonOk(iniciada)
  } catch (error) {
    return respuestaDeErrorDePostulacion(error)
  }
}
