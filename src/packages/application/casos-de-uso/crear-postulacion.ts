import { PeriodoCerrado } from '@tfi/domain'
import type { Reloj } from '../puertos/reloj/puerto'
import type { RepositorioDePeriodos } from '../puertos/repositorio-de-periodos/puerto'
import type { RepositorioDePostulaciones } from '../puertos/repositorio-de-postulaciones/puerto'
import type { Actor } from './actor'
import { exigirRol } from './actor'
import { NoEncontrado } from './errores'
import { aPostulacionConsultada } from './postulacion-consultada'
import type { PostulacionConsultada } from './postulacion-consultada'

/**
 * US2: el aspirante crea su Postulación en un período abierto.
 *
 * La autorización es del caso de uso (Principio VII): solo `ASPIRANTE`, y
 * siempre para sí mismo. La duplicada activa la rechaza el repositorio con
 * `PostulacionDuplicada` (índice único parcial en la base).
 */
export class CrearPostulacionUseCase {
  constructor(
    private readonly postulaciones: RepositorioDePostulaciones,
    private readonly periodos: RepositorioDePeriodos,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(actor: Actor, periodoId: string): Promise<PostulacionConsultada> {
    exigirRol(actor, 'ASPIRANTE')

    const periodo = await this.periodos.obtenerPorId(periodoId)
    if (!periodo) throw new NoEncontrado('El período de ingreso no existe')

    const ahora = this.reloj.ahora()
    if (!periodo.estaAbierto(ahora)) throw new PeriodoCerrado(periodoId)

    const creada = await this.postulaciones.crear(actor.perfilId, periodoId)

    return aPostulacionConsultada(creada, ahora)
  }
}
