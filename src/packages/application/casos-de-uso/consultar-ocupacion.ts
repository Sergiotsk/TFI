import { ROLES_DEL_PERSONAL } from '@tfi/domain'
import type { Reloj } from '../puertos/reloj/puerto'
import type { RepositorioDePeriodos } from '../puertos/repositorio-de-periodos/puerto'
import type { Actor } from './actor'
import { exigirRol } from './actor'
import { NoEncontrado } from './errores'

/** Foto de la ocupación de un período, derivada de sus Postulaciones. */
export interface OcupacionDePeriodo {
  periodoId: string
  nombre: string
  totalCupos: number
  ocupados: number
  pendientesVigentes: number
  libres: number
  cierraEl: Date
}

/**
 * US3: ocupación de un período para el personal.
 *
 * `ocupados` son las vacantes confirmadas y posteriores; `pendientesVigentes`
 * son los pagos pendientes que todavía no vencieron. Ambos restan del total:
 * `libres` es lo que `IniciarPago` usa para decidir si hay lugar (FR-004).
 */
export class ConsultarOcupacionUseCase {
  constructor(
    private readonly periodos: RepositorioDePeriodos,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(actor: Actor, periodoId: string): Promise<OcupacionDePeriodo> {
    exigirRol(actor, ...ROLES_DEL_PERSONAL)

    const periodo = await this.periodos.obtenerPorId(periodoId)
    if (!periodo || periodo.institucionId !== actor.institucionId) {
      throw new NoEncontrado('El período de ingreso no existe')
    }

    const ahora = this.reloj.ahora()
    const [ocupados, pendientesVigentes] = await Promise.all([
      this.periodos.contarOcupados(periodoId),
      this.periodos.contarPendientesVigentes(periodoId, ahora),
    ])

    return {
      periodoId: periodo.id,
      nombre: periodo.nombre,
      totalCupos: periodo.totalCupos,
      ocupados,
      pendientesVigentes,
      libres: periodo.cuposLibres(ocupados, pendientesVigentes),
      cierraEl: periodo.cierraEl,
    }
  }
}
