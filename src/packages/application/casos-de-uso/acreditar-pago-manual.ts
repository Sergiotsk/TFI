import { ROLES_DEL_PERSONAL, SinCuposParaConfirmar } from '@tfi/domain'
import type { Reloj } from '../puertos/reloj/puerto'
import type { AccionesDelPersonal } from '../puertos/acciones-del-personal/puerto'
import type { RepositorioDePostulaciones } from '../puertos/repositorio-de-postulaciones/puerto'
import type { Actor } from './actor'
import { exigirRol } from './actor'
import { ConflictoDeEstado, NoAutorizado, NoEncontrado } from './errores'
import { aPostulacionConsultada } from './postulacion-consultada'
import type { PostulacionConsultada } from './postulacion-consultada'

/**
 * Acción manual del personal: acredita un pago verificado fuera del sistema.
 *
 * Solo se puede desde `PAGO_PENDIENTE` o `VENCIDO`. La confirmación la ejecuta
 * el puerto `AccionesDelPersonal`, que en Supabase es una RPC con lock del
 * período: el cupo se vuelve a controlar ahí para que dos confirmaciones
 * simultáneas por el último lugar no pasen las dos.
 */
export class AcreditarPagoManualUseCase {
  constructor(
    private readonly postulaciones: RepositorioDePostulaciones,
    private readonly acciones: AccionesDelPersonal,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(actor: Actor, postulacionId: string): Promise<PostulacionConsultada> {
    exigirRol(actor, ...ROLES_DEL_PERSONAL)

    const postulacion = await this.postulaciones.obtenerPorId(postulacionId)
    if (!postulacion) throw new NoEncontrado('Postulación no encontrada')

    const ahora = this.reloj.ahora()
    const estado = postulacion.estadoEn(ahora)

    if (estado !== 'PAGO_PENDIENTE' && estado !== 'VENCIDO') {
      throw new ConflictoDeEstado(
        `La Postulación está en ${estado} y no se puede acreditar un pago`,
      )
    }

    const resultado = await this.acciones.confirmarVacante(postulacionId)

    switch (resultado.resultado) {
      case 'OK':
        return aPostulacionConsultada(resultado.postulacion, ahora)
      case 'SIN_CUPO':
        throw new SinCuposParaConfirmar(postulacion.periodoId)
      case 'CONFLICTO':
        throw new ConflictoDeEstado()
      case 'NO_ENCONTRADA':
        throw new NoEncontrado('Postulación no encontrada')
      case 'NO_AUTORIZADO':
        throw new NoAutorizado()
    }
  }
}
