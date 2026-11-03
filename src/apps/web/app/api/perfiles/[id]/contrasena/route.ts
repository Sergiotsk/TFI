import { crearCliente } from '@/lib/supabase/servidor'
import { crearClienteServiceRole } from '@/lib/supabase/service-role'
import { crearDependencias, crearDependenciasDeAdministracion } from '@/composition-root'
import { esquemaParametrosDePerfil } from '@/http/esquemas/acciones'
import { respuestaDeErrorDePostulacion } from '@/http/errores'
import { jsonError, jsonOk } from '@/http/respuesta'

type Parametros = { params: Promise<{ id: string }> }

/**
 * `POST /api/perfiles/:id/contrasena` → `RestablecerContrasena`.
 *
 * Recuperación asistida: el personal deja la contraseña de la cuenta en la
 * inicial (`nombre` + `dni`), sin pedir la anterior y sin depender del email.
 * La autorización (rol, institución y jerarquía) la resuelve el caso de uso.
 */
export async function POST(_request: Request, { params }: Parametros) {
  const parametros = esquemaParametrosDePerfil.safeParse(await params)

  if (!parametros.success) {
    return jsonError('DATOS_INVALIDOS', 'Los datos ingresados no son válidos', 400, {
      id: parametros.error.issues[0]?.message ?? 'Dato inválido',
    })
  }

  const supabase = await crearCliente()
  const { obtenerActorUseCase } = crearDependencias(supabase)

  const actor = await obtenerActorUseCase.ejecutar()

  if (actor.resultado === 'SIN_SESION') {
    return jsonError('NO_AUTENTICADO', 'No autenticado', 401)
  }

  if (actor.resultado === 'SIN_PERFIL') {
    return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)
  }

  // El cliente con service role se crea recién después de saber quién pide:
  // si falta la clave, el error es de configuración (500), no un 403 engañoso.
  let clienteAdmin: ReturnType<typeof crearClienteServiceRole>

  try {
    clienteAdmin = crearClienteServiceRole()
  } catch {
    return jsonError(
      'ERROR_INTERNO',
      'El servidor no tiene configurada la administración de contraseñas',
      500,
    )
  }

  const { restablecerContrasena } = crearDependenciasDeAdministracion(clienteAdmin)

  try {
    const resultado = await restablecerContrasena.ejecutar(actor.actor, parametros.data.id)

    return jsonOk(resultado)
  } catch (error) {
    return respuestaDeErrorDePostulacion(error)
  }
}
