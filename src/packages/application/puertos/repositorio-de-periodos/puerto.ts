import type { PeriodoDeIngreso } from '@tfi/domain'

/**
 * Puerta de acceso a los períodos de ingreso.
 *
 * La ocupación no es una columna: `contarOcupados` y `contarPendientesVigentes`
 * cuentan Postulaciones. `contarPendientesVigentes` excluye las que ya vencieron
 * (vencimiento perezoso): una `PAGO_PENDIENTE` con `vence_el < ahora` no ocupa
 * cupo ni reserva lugar.
 */
export interface RepositorioDePeriodos {
  obtenerPorId(id: string): Promise<PeriodoDeIngreso | null>
  listarAbiertos(institucionId: string, ahora: Date): Promise<PeriodoDeIngreso[]>
  contarOcupados(periodoId: string): Promise<number>
  contarPendientesVigentes(periodoId: string, ahora: Date): Promise<number>
  guardar(periodo: PeriodoDeIngreso): Promise<void>
}
