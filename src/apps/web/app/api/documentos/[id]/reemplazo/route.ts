import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import {
  esquemaParametrosDeDocumento,
  esquemaReemplazoDeDocumento,
} from '@/http/esquemas/documentos'
import { detallesDeZod } from '@/http/esquemas/errores'
import { respuestaDeErrorDePostulacion } from '@/http/errores'
import { jsonError, jsonOk } from '@/http/respuesta'

type Parametros = { params: Promise<{ id: string }> }

/** `POST /api/documentos/:id/reemplazo` → `ReemplazarDocumento`. */
export async function POST(request: Request, { params }: Parametros) {
  const parametros = esquemaParametrosDeDocumento.safeParse(await params)
  if (!parametros.success) {
    return jsonError('DATOS_INVALIDOS', 'Los datos ingresados no son válidos', 400, {
      id: parametros.error.issues[0]?.message ?? 'Dato inválido',
    })
  }

  let formulario: FormData
  try {
    formulario = await request.formData()
  } catch {
    return jsonError('DATOS_INVALIDOS', 'El cuerpo debe ser multipart/form-data', 400)
  }

  const parsed = esquemaReemplazoDeDocumento.safeParse({
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
  const { obtenerActorUseCase, reemplazarDocumento } = crearDependencias(supabase)

  const actor = await obtenerActorUseCase.ejecutar()

  if (actor.resultado === 'SIN_SESION') {
    return jsonError('NO_AUTENTICADO', 'No autenticado', 401)
  }

  if (actor.resultado === 'SIN_PERFIL') {
    return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)
  }

  try {
    const archivo = parsed.data.archivo
    const documento = await reemplazarDocumento.ejecutar(actor.actor, parametros.data.id, {
      contenido: await archivo.arrayBuffer(),
      nombreArchivo: archivo.name,
      mimeType: archivo.type,
    })

    return jsonOk(documento, 201)
  } catch (error) {
    return respuestaDeErrorDePostulacion(error)
  }
}
