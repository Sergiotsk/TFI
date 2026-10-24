import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { esquemaAcreditaciones } from '@/http/esquemas/pagos'
import { detallesDeZod } from '@/http/esquemas/errores'
import { respuestaDeErrorDePostulacion } from '@/http/errores'
import { presentarCarga } from '@/http/pagos'
import { jsonError, jsonOk } from '@/http/respuesta'

/**
 * `POST /api/pagos/acreditaciones` → `ImportarInformeDePagos` (US1).
 *
 * Solo `TESORERIA`. Recibe las filas del informe ya leídas (JSON): el archivo lo
 * lee el panel con el lector del formato provisorio. Devuelve la carga con el
 * resumen y el resultado de cada fila; las que fallaron (`ERROR`) se pueden
 * reenviar, porque la idempotencia por referencia hace seguro el reproceso.
 */
export async function POST(request: Request) {
  let cuerpo: unknown
  try {
    cuerpo = await request.json()
  } catch {
    return jsonError('DATOS_INVALIDOS', 'El cuerpo debe ser JSON', 400)
  }

  const parsed = esquemaAcreditaciones.safeParse(cuerpo)
  if (!parsed.success) {
    return jsonError(
      'DATOS_INVALIDOS',
      'Los datos ingresados no son válidos',
      400,
      detallesDeZod(parsed.error),
    )
  }

  const supabase = await crearCliente()
  const { obtenerActorUseCase, importarInformeDePagos } = crearDependencias(supabase)

  const actor = await obtenerActorUseCase.ejecutar()

  if (actor.resultado === 'SIN_SESION') {
    return jsonError('NO_AUTENTICADO', 'No autenticado', 401)
  }

  if (actor.resultado === 'SIN_PERFIL') {
    return jsonError('SIN_PERFIL', 'Perfil no encontrado', 403)
  }

  try {
    const resultado = await importarInformeDePagos.ejecutar(
      actor.actor,
      parsed.data.nombreArchivo,
      parsed.data.pagos,
    )

    return jsonOk(
      {
        carga: presentarCarga(resultado.carga),
        filas: resultado.filas,
        conError: resultado.conError,
      },
      201,
    )
  } catch (error) {
    return respuestaDeErrorDePostulacion(error)
  }
}
