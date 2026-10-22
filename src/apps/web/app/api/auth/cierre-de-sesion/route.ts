import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { jsonError, jsonOk } from '@/http/respuesta'

export async function POST() {
  try {
    const supabase = await crearCliente()
    const { cerrarSesion } = crearDependencias(supabase)
    await cerrarSesion.ejecutar()
    return jsonOk({ ok: true })
  } catch {
    return jsonError('ERROR_INTERNO', 'Ocurrió un error inesperado', 500)
  }
}
