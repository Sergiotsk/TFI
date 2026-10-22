import { ROLES_DEL_PERSONAL } from '@tfi/domain'
import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { esquemaActualizarPerfil, esquemaParametrosDePerfil } from '@/http/esquemas/acciones'
import { detallesDeZod } from '@/http/esquemas/errores'
import { respuestaDeErrorDePostulacion } from '@/http/errores'
import { jsonError, jsonOk } from '@/http/respuesta'

/**
 * Devuelve un perfil por id.
 *
 * Un aspirante solo puede ver el suyo; el personal de la facultad puede ver
 * los de su institucion (eso lo acota RLS en la base).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const supabase = await crearCliente()
  const { obtenerActorUseCase, repoPerfiles } = crearDependencias(supabase)

  const actor = await obtenerActorUseCase.ejecutar()

  if (actor.resultado === 'SIN_SESION') {
    return jsonError('NO_AUTENTICADO', 'No autenticado', 401)
  }

  if (actor.resultado === 'SIN_PERFIL') {
    return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)
  }

  const esPropio = actor.actor.perfilId === id
  if (!esPropio && !ROLES_DEL_PERSONAL.includes(actor.actor.rol)) {
    return jsonError('NO_AUTORIZADO', 'No tenés permisos para ver ese perfil', 403)
  }

  const perfil = await repoPerfiles.obtenerPorId(id)

  if (!perfil) {
    return jsonError('NO_ENCONTRADO', 'Perfil no encontrado', 404)
  }

  return jsonOk(perfil)
}

/**
 * `PATCH /api/perfiles/:id` → `ActualizarPerfil`.
 *
 * Acción del personal (`SECRETARIA`, `TESORERIA`, `DIRECCION`): corrige los
 * datos personales de un perfil de su institución. No se puede cambiar el rol,
 * el email, la institución ni el estado de verificación.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const parametros = esquemaParametrosDePerfil.safeParse(await params)

  if (!parametros.success) {
    return jsonError('DATOS_INVALIDOS', 'Los datos ingresados no son válidos', 400, {
      id: parametros.error.issues[0]?.message ?? 'Dato inválido',
    })
  }

  const cuerpo: unknown = await request.json().catch(() => null)
  const parsed = esquemaActualizarPerfil.safeParse(cuerpo)

  if (!parsed.success) {
    return jsonError(
      'DATOS_INVALIDOS',
      'Los datos ingresados no son válidos',
      400,
      detallesDeZod(parsed.error),
    )
  }

  const supabase = await crearCliente()
  const { obtenerActorUseCase, actualizarPerfil } = crearDependencias(supabase)

  const actor = await obtenerActorUseCase.ejecutar()

  if (actor.resultado === 'SIN_SESION') {
    return jsonError('NO_AUTENTICADO', 'No autenticado', 401)
  }

  if (actor.resultado === 'SIN_PERFIL') {
    return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)
  }

  try {
    const perfil = await actualizarPerfil.ejecutar(actor.actor, parametros.data.id, parsed.data)

    return jsonOk(perfil)
  } catch (error) {
    return respuestaDeErrorDePostulacion(error)
  }
}
