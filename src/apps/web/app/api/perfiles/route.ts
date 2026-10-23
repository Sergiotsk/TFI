import { z } from 'zod'
import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { esquemaPaginacion } from '@/http/esquemas/paginacion'
import { detallesDeZod } from '@/http/esquemas/errores'
import { respuestaDeErrorDePostulacion } from '@/http/errores'
import { jsonError, jsonOk } from '@/http/respuesta'

const esquemaRol = z.enum(['ASPIRANTE', 'SECRETARIA', 'DIRECCION', 'TESORERIA'], {
  errorMap: () => ({ message: 'Rol desconocido' }),
})

const esquemaFiltrosDePerfiles = z.object({
  rol: esquemaRol.optional(),
  dni: z
    .string()
    .transform((valor) => valor.replace(/\D/g, ''))
    .pipe(z.string().regex(/^[0-9]{7,8}$/, 'El DNI debe tener 7 u 8 dígitos'))
    .optional(),
})

/**
 * Lista los perfiles de la institución.
 *
 * Solo el personal de la facultad (secretaría, dirección, tesorería) puede
 * listar: un aspirante solo ve su propio perfil (y por eso este endpoint le
 * responde 403). Filtros opcionales por rol y DNI exacto. La respuesta está
 * paginada (`items`, `total`, `pagina`, `porPagina`, `totalPaginas`).
 */
export async function GET(request: Request) {
  const url = new URL(request.url)

  const filtros = esquemaFiltrosDePerfiles.safeParse({
    rol: url.searchParams.get('rol') ?? undefined,
    dni: url.searchParams.get('dni') ?? undefined,
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
  const { obtenerActorUseCase, listarPerfiles } = crearDependencias(supabase)

  const actor = await obtenerActorUseCase.ejecutar()

  if (actor.resultado === 'SIN_SESION') {
    return jsonError('NO_AUTENTICADO', 'No autenticado', 401)
  }

  if (actor.resultado === 'SIN_PERFIL') {
    return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)
  }

  try {
    const pagina = await listarPerfiles.ejecutar(
      actor.actor,
      filtros.data,
      paginacion.data,
    )

    return jsonOk(pagina)
  } catch (error) {
    return respuestaDeErrorDePostulacion(error)
  }
}

// No hay POST: el perfil lo crea el trigger crear_perfil_al_registrarse, en la
// misma transacción que el usuario de Supabase Auth. La app no inserta en
// public.perfiles (ADR-0004 y migración 20261021000300).
