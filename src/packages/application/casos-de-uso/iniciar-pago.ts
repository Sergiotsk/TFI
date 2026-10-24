import { PeriodoCerrado, SinCuposParaIniciar } from '@tfi/domain'
import type { Reloj } from '../puertos/reloj/puerto'
import type { RepositorioDePeriodos } from '../puertos/repositorio-de-periodos/puerto'
import type { RepositorioDePostulaciones } from '../puertos/repositorio-de-postulaciones/puerto'
import type { Actor } from './actor'
import { exigirRol } from './actor'
import { ConflictoDeEstado, NoAutorizado, NoEncontrado } from './errores'
import { aPostulacionConsultada } from './postulacion-consultada'
import type { PostulacionConsultada } from './postulacion-consultada'

/**
 * US2: el aspirante elige pagar y arranca su plazo.
 *
 * FR-011: no se entra en `PAGO_PENDIENTE` con el período cerrado o sin cupos
 * libres. Iniciar el pago **no reserva** el lugar: el aviso se lo dice.
 *
 * Si la Postulación estaba `PAGO_PENDIENTE` y el plazo ya pasó, primero se
 * persiste el `VENCIDO` (vencimiento perezoso): el trigger guardián no acepta
 * `PAGO_PENDIENTE -> PAGO_PENDIENTE`.
 */
export class IniciarPagoUseCase {
  constructor(
    private readonly postulaciones: RepositorioDePostulaciones,
    private readonly periodos: RepositorioDePeriodos,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(actor: Actor, postulacionId: string): Promise<PostulacionConsultada> {
    exigirRol(actor, 'ASPIRANTE')

    const postulacion = await this.postulaciones.obtenerPorId(postulacionId)
    if (!postulacion) throw new NoEncontrado('La Postulación no existe')
    if (postulacion.aspiranteId !== actor.perfilId) throw new NoAutorizado()

    const periodo = await this.periodos.obtenerPorId(postulacion.periodoId)
    if (!periodo) throw new NoEncontrado('El período de ingreso no existe')

    const ahora = this.reloj.ahora()
    if (!periodo.estaAbierto(ahora)) throw new PeriodoCerrado(periodo.id)

    // `iniciarPago` valida la transición: no se reinicia un plazo que sigue vigente.
    const vigente =
      postulacion.estadoEn(ahora) === postulacion.estado
        ? postulacion
        : postulacion.vencer(ahora)
    const enPago = vigente.iniciarPago(periodo.calcularVencimiento(ahora), ahora)

    const ocupados = await this.periodos.contarOcupados(periodo.id)
    const pendientesVigentes = await this.periodos.contarPendientesVigentes(periodo.id, ahora)
    if (periodo.cuposLibres(ocupados, pendientesVigentes) <= 0) {
      throw new SinCuposParaIniciar(periodo.id)
    }

    if (vigente !== postulacion) {
      const vencimiento = await this.postulaciones.guardarTransicion(postulacion, vigente)
      if (vencimiento === 'conflicto') throw new ConflictoDeEstado()
    }

    const guardado = await this.postulaciones.guardarTransicion(vigente, enPago)
    if (guardado === 'conflicto') throw new ConflictoDeEstado()

    return aPostulacionConsultada(enPago, ahora)
  }
}
