import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { esquemaPaginacion } from '@/http/esquemas/paginacion'
import { detallesDeZod } from '@/http/esquemas/errores'
import { respuestaDeErrorDePostulacion } from '@/http/errores'
import { jsonError, jsonOk } from '@/http/respuesta'

/**
 * `GET /api/periodos/todos` → `ListarPeriodosTodos` (US3).
 *
 * Solo el personal de la facultad. Incluye los períodos cerrados, que
 * `GET /api/periodos` no muestra. Respuesta paginada, del más reciente al más
 * viejo.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const paginacion = esquemaPaginacion.safeParse({
    pagina: url.searchParams.get('pagina') ?? undefined,
    porPagina: url.searchParams.get('porPagina') ?? undefined,
  })

  if (!paginacion.success) {
    return jsonError(
      'DATOS_INVALIDOS',
      'Los datos ingresados no son válidos',
      400,
      detallesDeZod(paginacion.error),
    )
  }

  const supabase = await crearCliente()
  const { obtenerActorUseCase, listarPeriodosTodos } = crearDependencias(supabase)

  const actor = await obtenerActorUseCase.ejecutar()

  if (actor.resultado === 'SIN_SESION') {
    return jsonError('NO_AUTENTICADO', 'No autenticado', 401)
  }

  if (actor.resultado === 'SIN_PERFIL') {
    return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)
  }

  try {
    const pagina = await listarPeriodosTodos.ejecutar(actor.actor, paginacion.data)

    return jsonOk(pagina)
  } catch (error) {
    return respuestaDeErrorDePostulacion(error)
  }
}
