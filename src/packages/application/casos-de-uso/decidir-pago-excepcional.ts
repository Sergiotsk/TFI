import type { Pago, ResolucionDeDireccion } from '@tfi/domain'
import type { RegistroDePagos } from '../puertos/registro-de-pagos/puerto'
import type { Actor } from './actor'
import { exigirRol } from './actor'
import { ConflictoDeEstado } from './errores'

/**
 * Dirección decide un pago A_DECIDIR (fuera de plazo o sin cupo, US5). Aceptar
 * confirma la vacante aunque exceda el cupo; rechazar deja la Postulación VENCIDO
 * y el pago DEVUELTO para que Tesorería reintegre la matrícula.
 *
 * Solo DIRECCION (FR-008). La institución la controla la RPC con la sesión.
 */
export class DecidirPagoExcepcionalUseCase {
  constructor(private readonly pagos: RegistroDePagos) {}

  async ejecutar(
    actor: Actor,
    pagoId: string,
    decision: ResolucionDeDireccion,
    comentario?: string,
  ): Promise<Pago> {
    exigirRol(actor, 'DIRECCION')

    const resultado = await this.pagos.registrarDecision(
      pagoId,
      decision,
      actor.perfilId,
      comentario?.trim() || undefined,
    )
    if (resultado.tipo === 'CONFLICTO') {
      throw new ConflictoDeEstado('El caso ya fue decidido o cambió de estado. Actualizá la bandeja.')
    }

    return resultado.pago
  }
}
