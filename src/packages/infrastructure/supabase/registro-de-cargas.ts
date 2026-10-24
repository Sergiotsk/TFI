import type { SupabaseClient } from '@supabase/supabase-js'
import type { RegistroDeCargas } from '@tfi/application'
import type { CargaDeInforme, ResumenDeCarga } from '@tfi/domain'
import { COLUMNAS_DE_CARGA, mapearCarga } from './mapeadores/pago'

/**
 * Adaptador de `RegistroDeCargas` sobre Supabase. Las altas y los cierres los
 * hace Tesorería con su sesión (policies `cargas_alta` y `cargas_cierre`).
 */
export class RegistroDeCargasSupabase implements RegistroDeCargas {
  constructor(private readonly supabase: SupabaseClient) {}

  async iniciar(institucionId: string, cargadaPor: string, nombreArchivo: string): Promise<CargaDeInforme> {
    const { data, error } = await this.supabase
      .from('cargas_de_informe')
      .insert({ institucion_id: institucionId, cargada_por: cargadaPor, nombre_archivo: nombreArchivo })
      .select(COLUMNAS_DE_CARGA)
      .single()

    if (error) {
      throw new Error(`No se pudo abrir la carga del informe: ${error.message}`)
    }

    return mapearCarga(data)
  }

  async cerrar(cargaId: string, resumen: ResumenDeCarga): Promise<void> {
    const { error } = await this.supabase
      .from('cargas_de_informe')
      .update({
        acreditados: resumen.acreditados,
        a_decidir: resumen.aDecidir,
        no_imputados: resumen.noImputados,
        duplicados: resumen.duplicados,
      })
      .eq('id', cargaId)

    if (error) {
      throw new Error(`No se pudo cerrar la carga del informe: ${error.message}`)
    }
  }

  async listar(institucionId: string): Promise<CargaDeInforme[]> {
    const { data, error } = await this.supabase
      .from('cargas_de_informe')
      .select(COLUMNAS_DE_CARGA)
      .eq('institucion_id', institucionId)
      .order('cargada_el', { ascending: false })

    if (error) {
      throw new Error(`No se pudieron listar las cargas del informe: ${error.message}`)
    }

    return data.map(mapearCarga)
  }
}
