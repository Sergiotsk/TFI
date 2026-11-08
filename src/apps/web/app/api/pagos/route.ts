import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { esquemaEstadoDeBandeja } from '@/http/esquemas/pagos'
import { respuestaDeErrorDePostulacion } from '@/http/errores'
import { presentarPago } from '@/http/pagos'
import { jsonError, jsonOk } from '@/http/respuesta'

/**
 * `GET /api/pagos?estado=A_DECIDIR|NO_IMPUTADO|DEVUELTO` → `ListarBandeja`.
 *
 * `A_DECIDIR` es solo para Dirección; `NO_IMPUTADO` y `DEVUELTO`, para
 * Tesorería y Secretaría. Devuelve los pagos de la institución del actor.
 */
export async function GET(request: Request) {
  const parsed = esquemaEstadoDeBandeja.safeParse(new URL(request.url).searchParams.get('estado'))

  if (!parsed.success) {
    return jsonError('DATOS_INVALIDOS', 'Los datos ingresados no son válidos', 400, {
      estado: parsed.error.issues[0]?.message ?? 'Dato inválido',
    })
  }

  const supabase = await crearCliente()
  const { obtenerActorUseCase, listarBandeja } = crearDependencias(supabase)

  const actor = await obtenerActorUseCase.ejecutar()

  if (actor.resultado === 'SIN_SESION') {
    return jsonError('NO_AUTENTICADO', 'No autenticado', 401)
  }

  if (actor.resultado === 'SIN_PERFIL') {
    return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)
  }

  try {
    const pagos = await listarBandeja.ejecutar(actor.actor, parsed.data)

    return jsonOk(pagos.map(presentarPago))
  } catch (error) {
    return respuestaDeErrorDePostulacion(error)
  }
}
