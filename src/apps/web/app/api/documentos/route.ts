import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { esquemaPaginacion } from '@/http/esquemas/paginacion'
import {
  esquemaFiltrosDeDocumento,
  esquemaSubidaDeDocumento,
} from '@/http/esquemas/documentos'
import { detallesDeZod } from '@/http/esquemas/errores'
import { respuestaDeErrorDePostulacion } from '@/http/errores'
import { jsonError, jsonOk } from '@/http/respuesta'

/**
 * `GET /api/documentos` → `ListarDocumentos` (paginado).
 *
 * Secretaría y Dirección pueden listar toda su institución, con filtros
 * opcionales por Postulación, estado y tipo. El aspirante tiene que indicar
 * `postulacionId` y solo puede ver las propias.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const filtros = esquemaFiltrosDeDocumento.safeParse({
    postulacionId: url.searchParams.get('postulacionId') ?? undefined,
    estado: url.searchParams.get('estado') ?? undefined,
    tipo: url.searchParams.get('tipo') ?? undefined,
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
  const { obtenerActorUseCase, listarDocumentos } = crearDependencias(supabase)

  const actor = await obtenerActorUseCase.ejecutar()

  if (actor.resultado === 'SIN_SESION') {
    return jsonError('NO_AUTENTICADO', 'No autenticado', 401)
  }

  if (actor.resultado === 'SIN_PERFIL') {
    return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)
  }

  try {
    const pagina = await listarDocumentos.ejecutar(
      actor.actor,
      filtros.data,
      paginacion.data,
    )

    return jsonOk(pagina)
  } catch (error) {
    return respuestaDeErrorDePostulacion(error)
  }
}

/**
 * `POST /api/documentos` (multipart/form-data) → `SubirDocumento`.
 *
 * Campos: `postulacionId`, `tipo`, `vigencia` (días, opcional) y `archivo`.
 * Solo PDF, JPG o PNG de hasta 10 MB. La primera carga sobre una vacante
 * confirmada mueve la Postulación a `ESPERANDO_DOCUMENTACION`.
 */
export async function POST(request: Request) {
  let formulario: FormData
  try {
    formulario = await request.formData()
  } catch {
    return jsonError('DATOS_INVALIDOS', 'El cuerpo debe ser multipart/form-data', 400)
  }

  const parsed = esquemaSubidaDeDocumento.safeParse({
    postulacionId: formulario.get('postulacionId') ?? undefined,
    tipo: formulario.get('tipo') ?? undefined,
    vigencia: formulario.get('vigencia') ?? undefined,
    archivo: formulario.get('archivo') ?? undefined,
  })

  if (!parsed.success) {
    return jsonError(
      'DATOS_INVALIDOS',
      'Los datos ingresados no son válidos',
      400,
      detallesDeZod(parsed.error),
    )
  }

  const supabase = await crearCliente()
  const { obtenerActorUseCase, subirDocumento } = crearDependencias(supabase)

  const actor = await obtenerActorUseCase.ejecutar()

  if (actor.resultado === 'SIN_SESION') {
    return jsonError('NO_AUTENTICADO', 'No autenticado', 401)
  }

  if (actor.resultado === 'SIN_PERFIL') {
    return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)
  }

  try {
    const archivo = parsed.data.archivo
    const documento = await subirDocumento.ejecutar(actor.actor, {
      postulacionId: parsed.data.postulacionId,
      tipo: parsed.data.tipo,
      vigencia: parsed.data.vigencia,
      archivo: {
        contenido: await archivo.arrayBuffer(),
        nombreArchivo: archivo.name,
        mimeType: archivo.type,
      },
    })

    return jsonOk(documento, 201)
  } catch (error) {
    return respuestaDeErrorDePostulacion(error)
  }
}
