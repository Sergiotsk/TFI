import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  AccionesDeDocumentacion,
  ResultadoDeDocumentacion,
} from '@tfi/application'
import type { EstadoPostulacion } from '@tfi/domain'

/**
 * Adaptador de las transiciones de documentación.
 *
 * La RPC `cambiar_estado_de_documentacion` corre como `SECURITY DEFINER`,
 * valida la pertenencia y el grafo, y devuelve un código. El caso de uso
 * traduce el código a un error de dominio o de aplicación.
 */
export class AccionesDeDocumentacionSupabase implements AccionesDeDocumentacion {
  constructor(private readonly supabase: SupabaseClient) {}

  async transicionar(
    postulacionId: string,
    hacia: EstadoPostulacion,
  ): Promise<ResultadoDeDocumentacion> {
    const { data, error } = await this.supabase.rpc('cambiar_estado_de_documentacion', {
      p_postulacion_id: postulacionId,
      p_estado: hacia,
    })
    if (error) throw new Error(`No se pudo cambiar el estado de documentación: ${error.message}`)

    return (data as ResultadoDeDocumentacion | null) ?? 'CONFLICTO'
  }
}
