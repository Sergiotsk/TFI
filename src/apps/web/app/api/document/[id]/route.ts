import { ROLES_DEL_PERSONAL } from '@tfi/domain'
import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { jsonError, jsonOk } from '@/http/respuesta'

/**
 * Devuelve un documento por id. Misma autorización que la lista: solo el
 * personal de la facultad.
 *
 * Deuda conocida: el repositorio es el fake de @tfi/application hasta que
 * public.documentos tenga adaptador.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params
  const documento = await repoDocumentos.obtenerPorId(id)

  if (!documento) {
    return jsonError('NO_ENCONTRADO', 'Documento no encontrado', 404)
  }

  return jsonOk(documento)
}
