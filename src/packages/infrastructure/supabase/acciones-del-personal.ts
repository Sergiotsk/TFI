import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  AccionesDelPersonal,
  ResultadoDeConfirmacion,
  ResultadoDeProrroga,
  RepositorioDePostulaciones,
} from '@tfi/application'

const esquemaResultado = z.object({
  resultado: z.enum([
    'OK',
    'SIN_CUPO',
    'CONFLICTO',
    'NO_ENCONTRADA',
    'NO_AUTORIZADO',
    'PERIODO_CERRADO',
  ]),
})

function leerResultado(data: unknown) {
  const { resultado } = esquemaResultado.parse(data)
  return resultado
}

/**
 * Adaptador de `AccionesDelPersonal` sobre Supabase.
 *
 * Las acciones son RPC `SECURITY DEFINER`: la base toma el lock del período,
 * revalida el rol y el cupo, y escribe. Después de un OK se relee la
 * Postulación con el mismo cliente de sesión para devolver la entidad mapeada.
 */
export class AccionesDelPersonalSupabase implements AccionesDelPersonal {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly postulaciones: RepositorioDePostulaciones,
  ) {}

  async confirmarVacante(postulacionId: string): Promise<ResultadoDeConfirmacion> {
    const { data, error } = await this.supabase.rpc('confirmar_vacante_manual', {
      p_postulacion_id: postulacionId,
    })

    if (error) {
      throw new Error(`No se pudo acreditar el pago: ${error.message}`)
    }

    const resultado = leerResultado(data)
    if (resultado === 'OK') {
      const postulacion = await this.postulaciones.obtenerPorId(postulacionId)
      if (!postulacion) throw new Error('La Postulación confirmada no se pudo releer')

      return { resultado: 'OK', postulacion }
    }
    if (resultado === 'PERIODO_CERRADO') return { resultado: 'CONFLICTO' }

    return { resultado }
  }

  async prorrogarPlazo(postulacionId: string, venceEl: Date): Promise<ResultadoDeProrroga> {
    const { data, error } = await this.supabase.rpc('prorrogar_plazo_de_pago', {
      p_postulacion_id: postulacionId,
      p_vence_el: venceEl.toISOString(),
    })

    if (error) {
      throw new Error(`No se pudo prorrogar el plazo: ${error.message}`)
    }

    const resultado = leerResultado(data)
    if (resultado === 'OK') {
      const postulacion = await this.postulaciones.obtenerPorId(postulacionId)
      if (!postulacion) throw new Error('La Postulación prorrogada no se pudo releer')

      return { resultado: 'OK', postulacion }
    }
    if (resultado === 'SIN_CUPO') return { resultado: 'CONFLICTO' }

    return { resultado }
  }
}
