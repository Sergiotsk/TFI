import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import {
  esquemaCambiosDeDocumento,
  esquemaParametrosDeDocumento,
  esquemaRevisionDeDocumento,
} from '@/http/esquemas/documentos'
import { detallesDeZod } from '@/http/esquemas/errores'
import { respuestaDeErrorDePostulacion } from '@/http/errores'
import { jsonError, jsonOk } from '@/http/respuesta'

type Parametros = { params: Promise<{ id: string }> }

/**
 * `GET /api/documentos/:id` → `ConsultarDocumento`.
 *
 * Devuelve el documento y una URL firmada de cinco minutos. El acceso se valida
 * antes de firmar: el aspirante solo puede pedir los propios.
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

    return jsonOk(resultado)
  } catch (error) {
    return respuestaDeErrorDePostulacion(error)
  }
}

/**
 * `PATCH /api/documentos/:id`.
 *
 * Con `estado` (y `observaciones` si se observa) revisa el documento; sin
 * `estado`, corrige `tipo`, `vigencia` o `nombreArchivo`. Solo Secretaría y
 * Dirección, y solo antes de la validación.
 */
export async function PATCH(request: Request, { params }: Parametros) {
  const parametros = esquemaParametrosDeDocumento.safeParse(await params)

  if (!parametros.success) {
    return jsonError('DATOS_INVALIDOS', 'Los datos ingresados no son válidos', 400, {
      id: parametros.error.issues[0]?.message ?? 'Dato inválido',
    })
  }

  let cuerpo: unknown
  try {
    cuerpo = await request.json()
  } catch {
    return jsonError('DATOS_INVALIDOS', 'El cuerpo debe ser JSON', 400)
  }

  const esRevision =
    typeof cuerpo === 'object' && cuerpo !== null && 'estado' in cuerpo

  const revision = esRevision ? esquemaRevisionDeDocumento.safeParse(cuerpo) : null
  const cambios = esRevision ? null : esquemaCambiosDeDocumento.safeParse(cuerpo)

  if (revision !== null && !revision.success) {
    return jsonError(
      'DATOS_INVALIDOS',
      'Los datos ingresados no son válidos',
      400,
      detallesDeZod(revision.error),
    )
  }

  if (cambios !== null && !cambios.success) {
    return jsonError(
      'DATOS_INVALIDOS',
      'Los datos ingresados no son válidos',
      400,
      detallesDeZod(cambios.error),
    )
  }

  const supabase = await crearCliente()
  const {
    obtenerActorUseCase,
    revisarDocumento,
    actualizarDocumento,
  } = crearDependencias(supabase)

  const actor = await obtenerActorUseCase.ejecutar()

  if (actor.resultado === 'SIN_SESION') {
    return jsonError('NO_AUTENTICADO', 'No autenticado', 401)
  }

  if (actor.resultado === 'SIN_PERFIL') {
    return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)
  }

  try {
    if (revision !== null && revision.success) {
      const documento = await revisarDocumento.ejecutar(
        actor.actor,
        parametros.data.id,
        revision.data,
      )

      return jsonOk(documento)
    }

    if (cambios !== null && cambios.success) {
      const documento = await actualizarDocumento.ejecutar(
        actor.actor,
        parametros.data.id,
        cambios.data,
      )

      return jsonOk(documento)
    }

    return jsonError('DATOS_INVALIDOS', 'Los datos ingresados no son válidos', 400)
  } catch (error) {
    return respuestaDeErrorDePostulacion(error)
  }
}

/**
 * `DELETE /api/documentos/:id` → `EliminarDocumento`.
 *
 * El aspirante puede borrar los propios y el personal los de su institución,
 * siempre antes de la validación. Se borra el archivo del Storage y la fila.
 */
export async function DELETE(_request: Request, { params }: Parametros) {
  const parametros = esquemaParametrosDeDocumento.safeParse(await params)

  if (!parametros.success) {
    return jsonError('DATOS_INVALIDOS', 'Los datos ingresados no son válidos', 400, {
      id: parametros.error.issues[0]?.message ?? 'Dato inválido',
    })
  }

  const supabase = await crearCliente()
  const { obtenerActorUseCase, eliminarDocumento } = crearDependencias(supabase)

  const actor = await obtenerActorUseCase.ejecutar()

  if (actor.resultado === 'SIN_SESION') {
    return jsonError('NO_AUTENTICADO', 'No autenticado', 401)
  }

  if (actor.resultado === 'SIN_PERFIL') {
    return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)
  }

  try {
    await eliminarDocumento.ejecutar(actor.actor, parametros.data.id)

    return jsonOk({ eliminado: true })
  } catch (error) {
    return respuestaDeErrorDePostulacion(error)
  }
}
