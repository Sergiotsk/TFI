import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { esquemaProrrogaDePlazo } from '@/http/esquemas/acciones'
import { detallesDeZod } from '@/http/esquemas/errores'
import { esquemaParametrosDePostulacion } from '@/http/esquemas/postulaciones'
import { respuestaDeErrorDePostulacion } from '@/http/errores'
import { jsonError, jsonOk } from '@/http/respuesta'

/**
 * `POST /api/postulaciones/:id/prorrogar-plazo` → `ProrrogarPlazoDePago`.
 *
 * Acción del personal (`SECRETARIA`, `TESORERIA`, `DIRECCION`): extiende el
 * vencimiento de una `PAGO_PENDIENTE` o reactiva una `VENCIDO`. El nuevo
 * vencimiento se recorta al cierre del período; si ya cerró, responde 409.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const parametros = esquemaParametrosDePostulacion.safeParse(await params)

  if (!parametros.success) {
    return jsonError('DATOS_INVALIDOS', 'Los datos ingresados no son válidos', 400, {
      id: parametros.error.issues[0]?.message ?? 'Dato inválido',
    })
  }

  const cuerpo: unknown = await request.json().catch(() => null)
  const parsed = esquemaProrrogaDePlazo.safeParse(cuerpo)

  if (!parsed.success) {
    return jsonError(
      'DATOS_INVALIDOS',
      'Los datos ingresados no son válidos',
      400,
      detallesDeZod(parsed.error),
    )
  }

  const supabase = await crearCliente()
  const { obtenerActorUseCase, prorrogarPlazoDePago } = crearDependencias(supabase)

  const actor = await obtenerActorUseCase.ejecutar()

  if (actor.resultado === 'SIN_SESION') {
    return jsonError('NO_AUTENTICADO', 'No autenticado', 401)
  }

  if (actor.resultado === 'SIN_PERFIL') {
    return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)
  }

  try {
    const postulacion = await prorrogarPlazoDePago.ejecutar(
      actor.actor,
      parametros.data.id,
      parsed.data.dias,
    )

    return jsonOk(postulacion)
  } catch (error) {
    return respuestaDeErrorDePostulacion(error)
  }
}
