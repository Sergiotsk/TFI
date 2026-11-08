import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { esquemaParametrosDePostulacion } from '@/http/esquemas/postulaciones'
import { respuestaDeErrorDePostulacion } from '@/http/errores'
import { jsonError, jsonOk } from '@/http/respuesta'

/**
 * `POST /api/postulaciones/:id/acreditar-pago` → `AcreditarPagoManual`.
 *
 * Acción del personal (`SECRETARIA`, `TESORERIA`, `DIRECCION`): acredita un pago
 * verificado fuera del sistema y confirma la vacante. El cupo se vuelve a
 * controlar dentro de la RPC, con lock del período. No se puede usar desde
 * `PAGO_EN_REVISION`: esa excepción la decide Dirección.
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
  const { obtenerActorUseCase, acreditarPagoManual } = crearDependencias(supabase)

  const actor = await obtenerActorUseCase.ejecutar()

  if (actor.resultado === 'SIN_SESION') {
    return jsonError('NO_AUTENTICADO', 'No autenticado', 401)
  }

  if (actor.resultado === 'SIN_PERFIL') {
    return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)
  }

  try {
    const postulacion = await acreditarPagoManual.ejecutar(actor.actor, parsed.data.id)

    return jsonOk(postulacion)
  } catch (error) {
    return respuestaDeErrorDePostulacion(error)
  }
}
