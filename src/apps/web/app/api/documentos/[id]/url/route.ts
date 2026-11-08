import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { esquemaParametrosDeDocumento } from '@/http/esquemas/documentos'
import { respuestaDeErrorDePostulacion } from '@/http/errores'
import { jsonError, jsonOk } from '@/http/respuesta'

type Parametros = { params: Promise<{ id: string }> }

/**
 * `GET /api/documentos/:id/url` → `ConsultarDocumento`.
 *
 * Devuelve solo la URL firmada del archivo para poder refrescarla sin volver a
 * traer los metadatos. La URL vence a los 60 segundos (la ventana más corta que
 * tolera abrir un PDF en el navegador) y se firma recién después de validar el
 * acceso: el dueño de la Postulación o Secretaría y Dirección de su institución.
 * Tesorería y cualquier otro aspirante reciben 403.
 */
export async function GET(_request: Request, { params }: Parametros) {
  const parametros = esquemaParametrosDeDocumento.safeParse(await params)

  if (!parametros.success) {
    return jsonError('DATOS_INVALIDOS', 'Los datos ingresados no son válidos', 400, {
      id: parametros.error.issues[0]?.message ?? 'Dato inválido',
    })
  }

  const supabase = await crearCliente()
  const { obtenerActorUseCase, consultarDocumento } = crearDependencias(supabase)

  const actor = await obtenerActorUseCase.ejecutar()

  if (actor.resultado === 'SIN_SESION') {
    return jsonError('NO_AUTENTICADO', 'No autenticado', 401)
  }

  if (actor.resultado === 'SIN_PERFIL') {
    return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)
  }

  try {
    const resultado = await consultarDocumento.ejecutar(actor.actor, parametros.data.id)

    return jsonOk({
      documentoId: resultado.documento.id,
      urlFirmada: resultado.urlFirmada,
      expiraEnSegundos: resultado.expiraEnSegundos,
    })
  } catch (error) {
    return respuestaDeErrorDePostulacion(error)
  }
}
