import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { esquemaIniciarPagoConPasarela } from '@/http/esquemas/pagos'
import { detallesDeZod } from '@/http/esquemas/errores'
import { respuestaDeErrorDePostulacion } from '@/http/errores'
import { jsonError, jsonOk } from '@/http/respuesta'

export async function POST(request: Request) {
  let cuerpo: unknown
  try {
    cuerpo = await request.json()
  } catch {
    return jsonError('DATOS_INVALIDOS', 'El cuerpo debe ser JSON', 400)
  }

  const parsed = esquemaIniciarPagoConPasarela.safeParse(cuerpo)
  if (!parsed.success) {
    return jsonError(
      'DATOS_INVALIDOS',
      'Los datos ingresados no son válidos',
      400,
      detallesDeZod(parsed.error),
    )
  }

  const supabase = await crearCliente()
  const deps = crearDependencias(supabase)

  if (!deps.iniciarPagoConPasarela) {
    return jsonError('NO_IMPLEMENTADO', 'La pasarela de pagos no está habilitada', 501)
  }

  const actor = await deps.obtenerActorUseCase.ejecutar()
  if (actor.resultado === 'SIN_SESION') {
    return jsonError('NO_AUTENTICADO', 'No autenticado', 401)
  }
  if (actor.resultado === 'SIN_PERFIL') {
    return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)
  }

  try {
    const resultado = await deps.iniciarPagoConPasarela.ejecutar(actor.actor, parsed.data.postulacionId)
    return jsonOk(resultado)
  } catch (error) {
    return respuestaDeErrorDePostulacion(error)
  }
}