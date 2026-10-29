import type {
  DecisionDeAcreditacion,
  EstadoDePago,
  Pago,
  PagoInformado,
  ReferenciaDePago,
  ResolucionDeDireccion,
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
 * Resultado de registrar una decisión de Dirección.
 *
 * - `REGISTRADA`: la decisión quedó guardada; `pago` es el pago ya ACREDITADO o DEVUELTO.
 * - `CONFLICTO`: el pago ya no está A_DECIDIR (otra decisión llegó antes) o la
 *   Postulación ya no está PAGO_EN_REVISION. No se escribió nada.
 */
export type ResultadoDeDecision = { tipo: 'REGISTRADA'; pago: Pago } | { tipo: 'CONFLICTO' }

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
 * `registrarDecision` aplica la decisión de Dirección sobre un pago A_DECIDIR, en
 * una operación atómica: `ACEPTAR` confirma la vacante **sin** mirar el cupo (la
 * decisión autoriza el exceso) y `RECHAZAR` deja la Postulación VENCIDO y el pago
 * DEVUELTO. En Supabase es la RPC `decidir_pago_excepcional`, que toma
 * `decididaPor` de la sesión.
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
  registrarDecision(
    pagoId: string,
    decision: ResolucionDeDireccion,
    decididaPor: string,
    comentario?: string,
  ): Promise<ResultadoDeDecision>
  existe(referencia: ReferenciaDePago): Promise<Pago | null>
  listarPorEstado(institucionId: string, estado: EstadoDePago): Promise<Pago[]>
}
