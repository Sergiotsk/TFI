import { obtenerActor } from '@/http/actor'
import { jsonError, jsonOk } from '@/http/respuesta'

export async function GET() {
  const resultado = await obtenerActor()

  if (resultado.tipo === 'SIN_SESION') {
    return jsonError('NO_AUTENTICADO', 'No autenticado', 401)
  }

  if (resultado.tipo === 'SIN_PERFIL') {
    return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)
  }

  return jsonOk({
    perfilId: resultado.actor.perfilId,
    rol: resultado.actor.rol,
    institucionId: resultado.actor.institucionId,
  })
}
