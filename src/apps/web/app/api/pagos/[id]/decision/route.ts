import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { esquemaDecision, esquemaParametrosDePago } from '@/http/esquemas/pagos'
import { detallesDeZod } from '@/http/esquemas/errores'
import { respuestaDeErrorDePostulacion } from '@/http/errores'
import { presentarPago } from '@/http/pagos'
import { jsonError, jsonOk } from '@/http/respuesta'

/**
 * `POST /api/pagos/:id/decision` → `DecidirPagoExcepcional` (US5).
 *
 * Solo `DIRECCION`. Recibe `{ decision: 'ACEPTAR' | 'RECHAZAR', comentario? }`
 * y devuelve el pago ya ACREDITADO o DEVUELTO. Si el caso ya se decidió o la
 * Postulación cambió de estado, 409.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const parametros = esquemaParametrosDePago.safeParse(await params)
  if (!parametros.success) {
    return jsonError('DATOS_INVALIDOS', 'Los datos ingresados no son válidos', 400, {
      id: parametros.error.issues[0]?.message ?? 'Dato inválido',
    })
  }

  let cuerpo: unknown
  try {
    cuerpo = await request.json()
  } catch {
    return jsonError('DATOS_INVALIDOS', 'El cuerpo debe ser JSON', 400)
  }

  const parsed = esquemaDecision.safeParse(cuerpo)
  if (!parsed.success) {
    return jsonError(
      'DATOS_INVALIDOS',
      'Los datos ingresados no son válidos',
      400,
      detallesDeZod(parsed.error),
    )
  }

  const supabase = await crearCliente()
  const { obtenerActorUseCase, decidirPagoExcepcional } = crearDependencias(supabase)

  const actor = await obtenerActorUseCase.ejecutar()

  if (actor.resultado === 'SIN_SESION') {
    return jsonError('NO_AUTENTICADO', 'No autenticado', 401)
  }

  if (actor.resultado === 'SIN_PERFIL') {
    return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)
  }

  try {
    const pago = await decidirPagoExcepcional.ejecutar(
      actor.actor,
      parametros.data.id,
      parsed.data.decision,
      parsed.data.comentario,
    )

    return jsonOk(presentarPago(pago))
  } catch (error) {
    return respuestaDeErrorDePostulacion(error)
  }
}
