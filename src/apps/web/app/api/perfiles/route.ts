import { z } from 'zod'
import { ROLES_DEL_PERSONAL } from '@tfi/domain'
import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { jsonError, jsonOk } from '@/http/respuesta'

const esquemaRol = z.enum(['ASPIRANTE', 'SECRETARIA', 'DIRECCION', 'TESORERIA'], {
  errorMap: () => ({ message: 'Rol desconocido' }),
})

/**
 * Lista los perfiles de la institucion.
 *
 * Solo el personal de la facultad (secretaria, direccion, tesoreria) puede
 * listar: un aspirante solo ve su propio perfil (y por eso este endpoint le
 * responde 403). El filtro por institucion lo aplica RLS en la base.
 */
export async function GET(request: Request) {
  const supabase = await crearCliente()
  const { obtenerActorUseCase, repoPerfiles } = crearDependencias(supabase)

  const actor = await obtenerActorUseCase.ejecutar()

  if (actor.resultado === 'SIN_SESION') {
    return jsonError('NO_AUTENTICADO', 'No autenticado', 401)
  }

  if (actor.resultado === 'SIN_PERFIL') {
    return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)
  }

  if (!ROLES_DEL_PERSONAL.includes(actor.actor.rol)) {
    return jsonError('NO_AUTORIZADO', 'No tenés permisos para listar perfiles', 403)
  }

  const rolPedido = new URL(request.url).searchParams.get('rol')

  if (rolPedido !== null) {
    const parsed = esquemaRol.safeParse(rolPedido)
    if (!parsed.success) {
      return jsonError('DATOS_INVALIDOS', 'Los datos ingresados no son válidos', 400, {
        rol: parsed.error.issues[0]?.message ?? 'Rol desconocido',
      })
    }

    const perfiles = await repoPerfiles.obtenerPorRol(parsed.data)
    return jsonOk(perfiles ?? [])
  }

  const perfiles = await repoPerfiles.obtenerTodos()
  return jsonOk(perfiles)
}

// No hay POST: el perfil lo crea el trigger crear_perfil_al_registrarse, en la
// misma transacción que el usuario de Supabase Auth. La app no inserta en
// public.perfiles (ADR-0004 y migración 20261021000300).
