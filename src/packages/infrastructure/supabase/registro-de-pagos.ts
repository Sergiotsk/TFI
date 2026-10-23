import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { RegistroDePagos, ResultadoDeAcreditacion } from '@tfi/application'
import type {
  DecisionDeAcreditacion,
  EstadoDePago,
  Pago,
  PagoInformado,
  ReferenciaDePago,
} from '@tfi/domain'
import { COLUMNAS_DE_PAGO, mapearPago } from './mapeadores/pago'

const esquemaRespuesta = z.discriminatedUnion('resultado', [
  z.object({ resultado: z.literal('REGISTRADO'), pago: z.unknown() }),
  z.object({ resultado: z.literal('DUPLICADO'), pago: z.unknown() }),
  z.object({ resultado: z.literal('CONFLICTO') }),
  z.object({ resultado: z.literal('NO_AUTORIZADO') }),
])

/**
 * Adaptador de `RegistroDePagos` sobre Supabase.
 *
 * `registrarAcreditacion` es la RPC `acreditar_pago`: inserta el pago de forma
 * idempotente, toma el lock del período y verifica las precondiciones que
 * asumió el dominio. Se usa con la sesión de Tesorería (la RPC verifica el rol
 * y la institución adentro).
 */
export class RegistroDePagosSupabase implements RegistroDePagos {
  constructor(private readonly supabase: SupabaseClient) {}

  async registrarAcreditacion(
    pago: PagoInformado,
    decision: DecisionDeAcreditacion,
    cargaId?: string,
  ): Promise<ResultadoDeAcreditacion> {
    const { data, error } = await this.supabase.rpc('acreditar_pago', {
      p_proveedor: pago.referencia.proveedor,
      p_referencia_externa: pago.referencia.referenciaExterna,
      p_monto_centavos: pago.monto.centavos,
      p_pagado_el: pago.pagadoEl.toISOString(),
      p_decision: decision.tipo,
      p_postulacion_id: decision.postulacionId ?? null,
      p_estado_esperado: decision.tipo === 'NO_IMPUTAR' ? null : decision.estadoEsperado,
      p_motivo_revision: decision.tipo === 'REVISION' ? decision.motivo : null,
      p_motivo_no_imputado: decision.tipo === 'NO_IMPUTAR' ? decision.motivo : null,
      p_dni_informado: pago.dni?.valor ?? null,
      p_numero_informado: pago.numero?.valor ?? null,
      p_carga_id: cargaId ?? null,
    })

    if (error) {
      throw new Error(`No se pudo registrar el pago: ${error.message}`)
    }

    const respuesta = esquemaRespuesta.parse(data)
    switch (respuesta.resultado) {
      case 'REGISTRADO':
        return { tipo: 'REGISTRADO', pago: mapearPago(respuesta.pago) }
      case 'DUPLICADO':
        return { tipo: 'DUPLICADO', pagoExistente: mapearPago(respuesta.pago) }
      case 'CONFLICTO':
        return { tipo: 'CONFLICTO' }
      case 'NO_AUTORIZADO':
        throw new Error('La base rechazó la acreditación: el usuario no es de Tesorería de esta institución')
    }
  }

  async existe(referencia: ReferenciaDePago): Promise<Pago | null> {
    const { data, error } = await this.supabase
      .from('pagos')
      .select(COLUMNAS_DE_PAGO)
      .eq('proveedor', referencia.proveedor)
      .eq('referencia_externa', referencia.referenciaExterna)
      .maybeSingle()

    if (error) {
      throw new Error(`No se pudo consultar el pago: ${error.message}`)
    }

    return data ? mapearPago(data) : null
  }

  /**
   * La institución la aplica RLS (`pagos_lectura`: por la Postulación o por la
   * carga). El parámetro queda por el contrato y para el fake.
   */
  async listarPorEstado(_institucionId: string, estado: EstadoDePago): Promise<Pago[]> {
    const { data, error } = await this.supabase
      .from('pagos')
      .select(COLUMNAS_DE_PAGO)
      .eq('estado', estado)
      .order('registrado_el', { ascending: false })

    if (error) {
      throw new Error(`No se pudieron listar los pagos: ${error.message}`)
    }

    return data.map(mapearPago)
  }
}
