import {
  PeriodoCerrado,
  ROLES_DEL_PERSONAL,
  SinCuposParaIniciar,
} from '@tfi/domain'
import type { Reloj } from '../puertos/reloj/puerto'
import type { AccionesDelPersonal } from '../puertos/acciones-del-personal/puerto'
import type { RepositorioDePeriodos } from '../puertos/repositorio-de-periodos/puerto'
import type { RepositorioDePostulaciones } from '../puertos/repositorio-de-postulaciones/puerto'
import type { Actor } from './actor'
import { exigirRol } from './actor'
import { ConflictoDeEstado, NoAutorizado, NoEncontrado } from './errores'
import { aPostulacionConsultada } from './postulacion-consultada'
import type { PostulacionConsultada } from './postulacion-consultada'

const UN_DIA = 24 * 60 * 60 * 1000

/**
 * Acción manual del personal: extiende el plazo de pago o reactiva una VENCIDO.
 *
 * El nuevo vencimiento es `min(ahora + días, cierre del período)`. Si el
 * período ya cerró, no se puede. Reactivar una VENCIDO vuelve a contar como
 * pago pendiente, así que exige cupo libre: si no, se repetiría el problema de
 * ofrecer un pago que después no se puede confirmar.
 */
export class ProrrogarPlazoDePagoUseCase {
  constructor(
    private readonly postulaciones: RepositorioDePostulaciones,
    private readonly periodos: RepositorioDePeriodos,
    private readonly acciones: AccionesDelPersonal,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    actor: Actor,
    postulacionId: string,
    dias: number,
  ): Promise<PostulacionConsultada> {
    exigirRol(actor, ...ROLES_DEL_PERSONAL)

    if (!Number.isInteger(dias) || dias <= 0) {
      throw new Error('Los días de prórroga deben ser un entero positivo')
    }

    const postulacion = await this.postulaciones.obtenerPorId(postulacionId)
    if (!postulacion) throw new NoEncontrado('Postulación no encontrada')

    const periodo = await this.periodos.obtenerPorId(postulacion.periodoId)
    if (!periodo) throw new NoEncontrado('Período de ingreso no encontrado')

    const ahora = this.reloj.ahora()
    const estado = postulacion.estadoEn(ahora)

    if (estado !== 'PAGO_PENDIENTE' && estado !== 'VENCIDO') {
      throw new ConflictoDeEstado(`La Postulación está en ${estado} y no se puede prorrogar`)
    }

    if (estado === 'VENCIDO') {
      const ocupados = await this.periodos.contarOcupados(periodo.id)
      const pendientes = await this.periodos.contarPendientesVigentes(periodo.id, ahora)
      if (periodo.totalCupos - ocupados - pendientes <= 0) {
        throw new SinCuposParaIniciar(periodo.id)
      }
    }

    const venceEl = new Date(
      Math.min(ahora.getTime() + dias * UN_DIA, periodo.cierraEl.getTime()),
    )

    if (venceEl.getTime() <= ahora.getTime()) throw new PeriodoCerrado(periodo.id)

    const resultado = await this.acciones.prorrogarPlazo(postulacionId, venceEl)

    switch (resultado.resultado) {
      case 'OK':
        return aPostulacionConsultada(resultado.postulacion, ahora)
      case 'CONFLICTO':
        throw new ConflictoDeEstado()
      case 'NO_ENCONTRADA':
        throw new NoEncontrado('Postulación no encontrada')
      case 'NO_AUTORIZADO':
        throw new NoAutorizado()
      case 'PERIODO_CERRADO':
        throw new PeriodoCerrado(periodo.id)
    }
  }
}
