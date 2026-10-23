import { NumeroDePostulacion, Postulacion, PostulacionDuplicada } from '@tfi/domain'
import type { EstadoPostulacion, MotivoRevision } from '@tfi/domain'
import { armarPagina, rangoDe } from '../../paginacion'
import type { Pagina, Paginacion } from '../../paginacion'
import type { FiltrosDePostulacion, RepositorioDePostulaciones } from './puerto'

export interface DatosDePostulacionSembrada {
  aspiranteId: string
  periodoId: string
  estado: EstadoPostulacion
  venceEl?: Date | null
  motivoRevision?: MotivoRevision | null
  /** Si se pasa, el aspirante queda asociado a ese DNI para `buscarPorDni`. */
  dni?: string
}

/**
 * Repositorio en memoria: el mismo contrato que el adaptador de Supabase, sin
 * base ni red. Lo usan los tests de los casos de uso y la suite de contrato.
 */
export class RepositorioDePostulacionesFake implements RepositorioDePostulaciones {
  private readonly postulaciones = new Map<string, Postulacion>()
  private readonly dnis = new Map<string, string>()
  private siguienteNumero = 1

  async obtenerPorId(id: string): Promise<Postulacion | null> {
    return this.postulaciones.get(id) ?? null
  }

  async obtenerPorNumero(numero: NumeroDePostulacion): Promise<Postulacion | null> {
    for (const postulacion of this.postulaciones.values()) {
      if (postulacion.numero.equals(numero)) return postulacion
    }

    return null
  }

  async listar(
    filtros: FiltrosDePostulacion,
    paginacion: Paginacion,
  ): Promise<Pagina<Postulacion>> {
    const filtradas = [...this.postulaciones.values()]
      .filter((p) => filtros.aspiranteId === undefined || p.aspiranteId === filtros.aspiranteId)
      .filter((p) => filtros.periodoId === undefined || p.periodoId === filtros.periodoId)
      .filter((p) => filtros.estado === undefined || p.estado === filtros.estado)
      .filter(
        (p) => filtros.motivoRevision === undefined || p.motivoRevision === filtros.motivoRevision,
      )
      .sort((a, b) => a.numero.valor - b.numero.valor)

    const { desde, hasta } = rangoDe(paginacion)

    return armarPagina(filtradas.slice(desde, hasta + 1), filtradas.length, paginacion)
  }

  async buscarPorDni(
    dni: string,
    paginacion: Paginacion,
    periodoId?: string,
  ): Promise<Pagina<Postulacion>> {
    const aspiranteId = this.aspiranteConDni(dni)
    if (aspiranteId === undefined) return armarPagina([], 0, paginacion)

    return this.listar({ aspiranteId, periodoId }, paginacion)
  }

  async crear(aspiranteId: string, periodoId: string): Promise<Postulacion> {
    const activa = [...this.postulaciones.values()].find(
      (p) =>
        p.aspiranteId === aspiranteId && p.periodoId === periodoId && p.estado !== 'VENCIDO',
    )
    if (activa) throw new PostulacionDuplicada(aspiranteId, periodoId)

    return this.agregar(aspiranteId, periodoId, 'PREINSCRIPTO', null, null)
  }

  async guardarTransicion(antes: Postulacion, despues: Postulacion): Promise<'ok' | 'conflicto'> {
    const actual = this.postulaciones.get(antes.id)
    if (!actual || actual.estado !== antes.estado) return 'conflicto'

    this.postulaciones.set(despues.id, despues)
    return 'ok'
  }

  /** El DNI vive en el perfil; el fake lo registra aparte para poder buscar. */
  registrarDni(aspiranteId: string, dni: string): void {
    this.dnis.set(aspiranteId, dni)
  }

  /** Fixture: deja una Postulación en el estado pedido, salteando la máquina. */
  sembrar(datos: DatosDePostulacionSembrada): Postulacion {
    if (datos.dni !== undefined) this.registrarDni(datos.aspiranteId, datos.dni)

    const venceEl =
      datos.venceEl !== undefined
        ? datos.venceEl
        : datos.estado === 'PAGO_PENDIENTE'
          ? new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
          : null
    const motivoRevision =
      datos.motivoRevision !== undefined
        ? datos.motivoRevision
        : datos.estado === 'PAGO_EN_REVISION'
          ? 'SIN_CUPO'
          : null

    return this.agregar(datos.aspiranteId, datos.periodoId, datos.estado, venceEl, motivoRevision)
  }

  private agregar(
    aspiranteId: string,
    periodoId: string,
    estado: EstadoPostulacion,
    venceEl: Date | null,
    motivoRevision: MotivoRevision | null,
  ): Postulacion {
    const numero = this.siguienteNumero
    this.siguienteNumero += 1
    const ahora = new Date()
    const postulacion = new Postulacion(
      `postulacion-fake-${numero}`,
      NumeroDePostulacion.desde(numero),
      aspiranteId,
      periodoId,
      estado,
      venceEl,
      motivoRevision,
      ahora,
      ahora,
    )

    this.postulaciones.set(postulacion.id, postulacion)
    return postulacion
  }

  private aspiranteConDni(dni: string): string | undefined {
    for (const [aspiranteId, valor] of this.dnis.entries()) {
      if (valor === dni) return aspiranteId
    }

    return undefined
  }
}
