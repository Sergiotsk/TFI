import type { Pago } from '@tfi/domain'
import type { RegistroDePagos } from '../puertos/registro-de-pagos/puerto'
import type { RepositorioDePerfiles } from '../puertos/repositorio-de-perfiles/puerto'
import type { RepositorioDePeriodos } from '../puertos/repositorio-de-periodos/puerto'
import type { RepositorioDePostulaciones } from '../puertos/repositorio-de-postulaciones/puerto'
import type { Actor } from './actor'
import { exigirRol } from './actor'

/** Un pago A_DECIDIR con lo que Dirección necesita para decidirlo (T091). */
export interface CasoADecidir {
  pago: Pago
  postulacion: { id: string; numero: string; venceEl: Date | null }
  /** `null` si el perfil no se puede leer. */
  aspirante: { nombre: string; apellido: string; dni: string } | null
  /** Ocupación actual: aceptar suma uno aunque ya esté lleno. */
  periodo: { id: string; nombre: string; totalCupos: number; ocupados: number }
}

/**
 * La bandeja de Dirección (US5): los pagos A_DECIDIR de su institución, con la
 * Postulación, el aspirante y la ocupación del período de cada uno.
 */
export class ListarCasosADecidirUseCase {
  constructor(
    private readonly pagos: RegistroDePagos,
    private readonly postulaciones: RepositorioDePostulaciones,
    private readonly periodos: RepositorioDePeriodos,
    private readonly perfiles: RepositorioDePerfiles,
  ) {}

  async ejecutar(actor: Actor): Promise<CasoADecidir[]> {
    exigirRol(actor, 'DIRECCION')

    const pagos = await this.pagos.listarPorEstado(actor.institucionId, 'A_DECIDIR')
    const casos = await Promise.all(pagos.map((pago) => this.armarCaso(pago)))

    return casos.filter((caso): caso is CasoADecidir => caso !== null)
  }

  private async armarCaso(pago: Pago): Promise<CasoADecidir | null> {
    if (pago.postulacionId === undefined) return null

    const postulacion = await this.postulaciones.obtenerPorId(pago.postulacionId)
    if (!postulacion) return null

    const [periodo, ocupados, perfil] = await Promise.all([
      this.periodos.obtenerPorId(postulacion.periodoId),
      this.periodos.contarOcupados(postulacion.periodoId),
      this.perfiles.obtenerPorId(postulacion.aspiranteId),
    ])
    if (!periodo) return null

    return {
      pago,
      postulacion: { id: postulacion.id, numero: postulacion.numero.formatear(), venceEl: postulacion.venceEl },
      aspirante: perfil ? { nombre: perfil.nombre, apellido: perfil.apellido, dni: perfil.dni } : null,
      periodo: { id: periodo.id, nombre: periodo.nombre, totalCupos: periodo.totalCupos, ocupados },
    }
  }
}
