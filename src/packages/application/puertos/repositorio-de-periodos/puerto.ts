import type { PeriodoDeIngreso } from '@tfi/domain'
import type { Pagina, Paginacion } from '../../paginacion'

/**
 * Puerta de acceso a los períodos de ingreso.
 *
 * La ocupación no es una columna: `contarOcupados` y `contarPendientesVigentes`
 * cuentan Postulaciones. `contarPendientesVigentes` excluye las que ya vencieron
 * (vencimiento perezoso): una `PAGO_PENDIENTE` con `vence_el < ahora` no ocupa
 * cupo ni reserva lugar.
 *
 * `listarAbiertos` es para todos (el aspirante elige dónde postularse).
 * `listarTodos` es para el personal y pagina en la base; incluye los cerrados.
 */
export interface RepositorioDePeriodos {
  obtenerPorId(id: string): Promise<PeriodoDeIngreso | null>
  listarAbiertos(institucionId: string, ahora: Date): Promise<PeriodoDeIngreso[]>
  listarTodos(
    institucionId: string,
    paginacion: Paginacion,
  ): Promise<Pagina<PeriodoDeIngreso>>
  contarOcupados(periodoId: string): Promise<number>
  contarPendientesVigentes(periodoId: string, ahora: Date): Promise<number>
  guardar(periodo: PeriodoDeIngreso): Promise<void>
}
