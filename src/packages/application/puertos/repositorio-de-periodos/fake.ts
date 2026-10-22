import { ocupaCupo } from '@tfi/domain'
import type { PeriodoDeIngreso } from '@tfi/domain'
import type { RepositorioDePostulaciones } from '../repositorio-de-postulaciones/puerto'
import type { RepositorioDePeriodos } from './puerto'

/**
 * Repositorio de períodos en memoria. La ocupación la calcula mirando las
 * Postulaciones del fake, igual que el adaptador la calcula con un `count`.
 */
export class RepositorioDePeriodosFake implements RepositorioDePeriodos {
  private readonly periodos = new Map<string, PeriodoDeIngreso>()

  constructor(private readonly postulaciones: RepositorioDePostulaciones) {}

  async obtenerPorId(id: string): Promise<PeriodoDeIngreso | null> {
    return this.periodos.get(id) ?? null
  }

  async listarAbiertos(institucionId: string, ahora: Date): Promise<PeriodoDeIngreso[]> {
    return [...this.periodos.values()]
      .filter((p) => p.institucionId === institucionId && p.estaAbierto(ahora))
      .sort((a, b) => a.cierraEl.getTime() - b.cierraEl.getTime())
  }

  async contarOcupados(periodoId: string): Promise<number> {
    const postulaciones = await this.postulaciones.listar({ periodoId })

    return postulaciones.filter((p) => ocupaCupo(p.estado)).length
  }

  async contarPendientesVigentes(periodoId: string, ahora: Date): Promise<number> {
    const postulaciones = await this.postulaciones.listar({ periodoId })

    return postulaciones.filter(
      (p) => p.estado === 'PAGO_PENDIENTE' && p.estadoEn(ahora) === 'PAGO_PENDIENTE',
    ).length
  }

  async guardar(periodo: PeriodoDeIngreso): Promise<void> {
    this.periodos.set(periodo.id, periodo)
  }
}
