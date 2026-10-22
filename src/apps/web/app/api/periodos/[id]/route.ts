import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import {
  esquemaModificarPeriodo,
  esquemaParametrosDePeriodo,
} from '@/http/esquemas/periodos'
import { detallesDeZod } from '@/http/esquemas/errores'
import { respuestaDeErrorDePostulacion } from '@/http/errores'
import { jsonError, jsonOk } from '@/http/respuesta'

/**
 * `PATCH /api/periodos/:id` → `ModificarPeriodo` (US3).
 *
 * Solo `DIRECCION`: el Director es el único que crea y modifica períodos.
 * Secretaría y Tesorería solo pueden consultarlos. El body es parcial: los
 * campos que no vienen quedan como estaban. Bajar el total por debajo de las
 * vacantes confirmadas devuelve 409 (FR-005).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const parametros = esquemaParametrosDePeriodo.safeParse(await params)

  if (!parametros.success) {
    return jsonError('DATOS_INVALIDOS', 'Los datos ingresados no son válidos', 400, {
      id: parametros.error.issues[0]?.message ?? 'Dato inválido',
    })
  }

  const cuerpo: unknown = await request.json().catch(() => null)
  const parsed = esquemaModificarPeriodo.safeParse(cuerpo)

  if (!parsed.success) {
    return jsonError(
      'DATOS_INVALIDOS',
      'Los datos ingresados no son válidos',
      400,
      detallesDeZod(parsed.error),
    )
  }

  const supabase = await crearCliente()
  const { obtenerActorUseCase, modificarPeriodo } = crearDependencias(supabase)

  const actor = await obtenerActorUseCase.ejecutar()

  if (actor.resultado === 'SIN_SESION') {
    return jsonError('NO_AUTENTICADO', 'No autenticado', 401)
  }

  if (actor.resultado === 'SIN_PERFIL') {
    return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)
  }

  try {
    const periodo = await modificarPeriodo.ejecutar(actor.actor, parametros.data.id, parsed.data)

    return jsonOk(periodo)
  } catch (error) {
    return respuestaDeErrorDePostulacion(error)
  }
}
