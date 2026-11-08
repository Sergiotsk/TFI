import type { Reloj } from '../reloj/puerto'
import type { RepositorioDePeriodos } from '../repositorio-de-periodos/puerto'
import type { RepositorioDePostulaciones } from '../repositorio-de-postulaciones/puerto'
import type {
  AccionesDelPersonal,
  ResultadoDeConfirmacion,
  ResultadoDeProrroga,
} from './puerto'

/**
 * Acciones del personal en memoria.
 *
 * Reproduce las garantías del adaptador: transición válida, cupo disponible
 * para confirmar y vencimiento dentro del cierre del período. La autorización
 * por rol vive en el caso de uso; la RPC la vuelve a verificar en la base.
 */
export class AccionesDelPersonalFake implements AccionesDelPersonal {
  constructor(
    private readonly postulaciones: RepositorioDePostulaciones,
    private readonly periodos: RepositorioDePeriodos,
    private readonly reloj: Reloj,
  ) {}

  async confirmarVacante(postulacionId: string): Promise<ResultadoDeConfirmacion> {
    const ahora = this.reloj.ahora()
    const postulacion = await this.postulaciones.obtenerPorId(postulacionId)
    if (!postulacion) return { resultado: 'NO_ENCONTRADA' }

    const estado = postulacion.estadoEn(ahora)
    if (estado !== 'PAGO_PENDIENTE' && estado !== 'VENCIDO') {
      return { resultado: 'CONFLICTO' }
    }

    const periodo = await this.periodos.obtenerPorId(postulacion.periodoId)
    if (!periodo) return { resultado: 'NO_ENCONTRADA' }

    const ocupados = await this.periodos.contarOcupados(periodo.id)
    if (ocupados >= periodo.totalCupos) return { resultado: 'SIN_CUPO' }

    const confirmada = postulacion.confirmar(ahora)
    const guardado = await this.postulaciones.guardarTransicion(postulacion, confirmada)
    if (guardado === 'conflicto') return { resultado: 'CONFLICTO' }

    return { resultado: 'OK', postulacion: confirmada }
  }

  async prorrogarPlazo(postulacionId: string, venceEl: Date): Promise<ResultadoDeProrroga> {
    const ahora = this.reloj.ahora()
    const postulacion = await this.postulaciones.obtenerPorId(postulacionId)
    if (!postulacion) return { resultado: 'NO_ENCONTRADA' }

    const periodo = await this.periodos.obtenerPorId(postulacion.periodoId)
    if (!periodo) return { resultado: 'NO_ENCONTRADA' }

    if (venceEl.getTime() <= ahora.getTime() || venceEl.getTime() > periodo.cierraEl.getTime()) {
      return { resultado: 'PERIODO_CERRADO' }
    }

    const estado = postulacion.estadoEn(ahora)
    if (estado !== 'PAGO_PENDIENTE' && estado !== 'VENCIDO') {
      return { resultado: 'CONFLICTO' }
    }

    const prorrogada = postulacion.prorrogar(venceEl, ahora)
    const guardado = await this.postulaciones.guardarTransicion(postulacion, prorrogada)
    if (guardado === 'conflicto') return { resultado: 'CONFLICTO' }

    return { resultado: 'OK', postulacion: prorrogada }
  }
}
