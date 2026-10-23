import { z } from 'zod'
import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { esquemaPaginacion } from '@/http/esquemas/paginacion'
import { detallesDeZod } from '@/http/esquemas/errores'
import { respuestaDeErrorDePostulacion } from '@/http/errores'
import { jsonError, jsonOk } from '@/http/respuesta'

const esquemaBusquedaPorDni = z.object({
  dni: z
    .string()
    .transform((valor) => valor.replace(/\D/g, ''))
    .pipe(z.string().regex(/^[0-9]{7,8}$/, 'El DNI debe tener 7 u 8 dígitos')),
  periodoId: z.string().uuid('El período no es válido').optional(),
})

/**
 * `GET /api/postulaciones/por-dni?dni=...&periodoId=...` → búsqueda del personal
 * por DNI del aspirante.
 *
 * Devuelve **cualquier estado**, no solo las pendientes de pago. El período es
 * opcional; sin él, el historial completo de la persona. La respuesta está
 * paginada. Es una ruta separada de `GET /api/postulaciones` para que el filtro
 * por DNI no se mezcle con los filtros por id de perfil y período.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const filtros = esquemaBusquedaPorDni.safeParse({
    dni: url.searchParams.get('dni') ?? undefined,
    periodoId: url.searchParams.get('periodoId') ?? undefined,
  })
  const paginacion = esquemaPaginacion.safeParse({
    pagina: url.searchParams.get('pagina') ?? undefined,
    porPagina: url.searchParams.get('porPagina') ?? undefined,
  })

  if (!filtros.success) {
    return jsonError(
      'DATOS_INVALIDOS',
      'Los datos ingresados no son válidos',
      400,
      detallesDeZod(filtros.error),
    )
  }

  if (!paginacion.success) {
    return jsonError(
      'DATOS_INVALIDOS',
      'Los datos ingresados no son válidos',
      400,
      detallesDeZod(paginacion.error),
    )
  }

  const supabase = await crearCliente()
  const { obtenerActorUseCase, buscarPostulacionesPorDni } = crearDependencias(supabase)

  const actor = await obtenerActorUseCase.ejecutar()

  if (actor.resultado === 'SIN_SESION') {
    return jsonError('NO_AUTENTICADO', 'No autenticado', 401)
  }

  if (actor.resultado === 'SIN_PERFIL') {
    return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)
  }

  try {
    const pagina = await buscarPostulacionesPorDni.ejecutar(
      actor.actor,
      filtros.data.dni,
      filtros.data.periodoId,
      paginacion.data,
    )

    return jsonOk(pagina)
  } catch (error) {
    return respuestaDeErrorDePostulacion(error)
  }
}
