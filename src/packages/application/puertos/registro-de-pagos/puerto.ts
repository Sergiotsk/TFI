import type {
  DecisionDeAcreditacion,
  EstadoDePago,
  Pago,
  PagoInformado,
  ReferenciaDePago,
} from '@tfi/domain'

/**
 * Resultado de registrar una acreditación.
 *
 * - `REGISTRADO`: el pago quedó guardado y la decisión aplicada.
 * - `DUPLICADO`: la referencia ya existía; no se escribió nada (idempotencia, SC-002).
 * - `CONFLICTO`: una precondición que asumió el dominio ya no vale (el estado de la
 *   Postulación cambió o se ocupó el último cupo). No se escribió nada: hay que
 *   releer y volver a decidir.
 */
export type ResultadoDeAcreditacion =
  | { tipo: 'REGISTRADO'; pago: Pago }
  | { tipo: 'DUPLICADO'; pagoExistente: Pago }
  | { tipo: 'CONFLICTO' }

/**
 * Registro de los pagos informados (informe de SysAdmin o Pagos360).
 *
 * `registrarAcreditacion` persiste la decisión que ya tomó el dominio
 * (`evaluarPago`): no decide nada. En una sola operación atómica inserta el pago
 * (idempotente por referencia), verifica que la Postulación siga en
 * `decision.estadoEsperado` (el estado **persistido**, no el efectivo) y, si es
 * `CONFIRMAR`, que quede cupo. En Supabase es la RPC `acreditar_pago`, que toma
 * el lock del período.
 *
 * `listarPorEstado` alcanza los pagos imputados a Postulaciones de la
 * institución y los no imputados de sus cargas de informe.
 */
export interface RegistroDePagos {
  registrarAcreditacion(
    pago: PagoInformado,
    decision: DecisionDeAcreditacion,
    cargaId?: string,
  ): Promise<ResultadoDeAcreditacion>
  existe(referencia: ReferenciaDePago): Promise<Pago | null>
  listarPorEstado(institucionId: string, estado: EstadoDePago): Promise<Pago[]>
}
