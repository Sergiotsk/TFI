import { ROLES_DEL_PERSONAL } from '@tfi/domain'
import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { jsonError, jsonOk } from '@/http/respuesta'

/**
 * Lista los documentos de las postulaciones.
 *
 * Solo el personal de la facultad (secretaría, dirección, tesorería) puede
 * leerlos: un aspirante solo ve su propio perfil, y los documentos se revisan
 * desde la secretaría.
 *
 * Deuda conocida: la tabla public.documentos todavía no tiene adaptador, así
 * que el repositorio es el fake de @tfi/application. La ruta ya pide sesión y
 * rol; el caso de uso llega con la feature de documentación.
 */
export async function GET(request: Request) {
  const supabase = await crearCliente()
  const { obtenerActorUseCase, repoDocumentos } = crearDependencias(supabase)

  const actor = await obtenerActorUseCase.ejecutar()

  if (actor.resultado === 'SIN_SESION') {
    return jsonError('NO_AUTENTICADO', 'No autenticado', 401)
  }

  if (actor.resultado === 'SIN_PERFIL') {
    return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)
  }

  if (!ROLES_DEL_PERSONAL.includes(actor.actor.rol)) {
    return jsonError('NO_AUTORIZADO', 'No tenés permisos para ver los documentos', 403)
  }

  const postulacionId = new URL(request.url).searchParams.get('postulacionId')

  const documentos = postulacionId
    ? await repoDocumentos.obtenerPorPostulacion(postulacionId)
    : await repoDocumentos.obtenerTodos()

  return jsonOk(documentos)
}

// No hay POST: el alta de documentos llega con la feature de documentación
// (y su caso de uso). Escribir a mano en el fake no guardaría nada.
