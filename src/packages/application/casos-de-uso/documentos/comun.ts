import type {
  Documento,
  EstadoPostulacion,
  PeriodoDeIngreso,
  Postulacion,
} from '@tfi/domain'
import type { Actor } from '../actor'
import { NoAutorizado, NoEncontrado, ConflictoDeEstado } from '../errores'
import type { AccionesDeDocumentacion } from '../../puertos/acciones-de-documentacion/puerto'
import type { Reloj } from '../../puertos/reloj/puerto'
import type { RepositorioDePeriodos } from '../../puertos/repositorio-de-periodos/puerto'
import type { RepositorioDePostulaciones } from '../../puertos/repositorio-de-postulaciones/puerto'

/** Roles que pueden revisar, editar o borrar documentos de cualquier persona. */
export const ROLES_QUE_GESTIONAN_DOCUMENTOS = ['SECRETARIA', 'DIRECCION'] as const

/** Estados de la Postulación en los que se puede cargar o corregir documentación. */
export const ESTADOS_QUE_ADMITEN_DOCUMENTOS = [
  'VACANTE_CONFIRMADA',
  'ESPERANDO_DOCUMENTACION',
  'DOCUMENTACION_EN_REVISION',
  'OBSERVADO',
] as const

export const TAMANIO_MAXIMO_DE_ARCHIVO = 10 * 1024 * 1024
export const MIME_TYPES_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/png'] as const
export const SEGUNDOS_DE_URL_FIRMADA = 60

export function puedeGestionarDocumentos(actor: Actor): boolean {
  return (ROLES_QUE_GESTIONAN_DOCUMENTOS as readonly string[]).includes(actor.rol)
}

export interface ContextoDeDocumento {
  postulacion: Postulacion
  periodo: PeriodoDeIngreso
}

export async function cargarContextoDeDocumento(
  actor: Actor,
  postulacionId: string,
  postulaciones: RepositorioDePostulaciones,
  periodos: RepositorioDePeriodos,
): Promise<ContextoDeDocumento> {
  const postulacion = await postulaciones.obtenerPorId(postulacionId)
  if (!postulacion) throw new NoEncontrado('La Postulación no existe')

  const periodo = await periodos.obtenerPorId(postulacion.periodoId)
  if (!periodo || periodo.institucionId !== actor.institucionId) {
    throw new NoEncontrado('La Postulación no existe')
  }

  return { postulacion, periodo }
}

/**
 * Autorización de lectura/escritura de documentación.
 *
 * Secretaría y Dirección operan sobre cualquier Postulación de su institución;
 * el aspirante solo sobre la propia. Tesorería no participa del circuito.
 */
export function exigirAccesoADocumentos(
  actor: Actor,
  contexto: ContextoDeDocumento,
): void {
  if (puedeGestionarDocumentos(actor)) return

  if (actor.rol !== 'ASPIRANTE' || contexto.postulacion.aspiranteId !== actor.perfilId) {
    throw new NoAutorizado('No tenés permisos para ver los documentos de esa Postulación')
  }
}

/** Solo Secretaría y Dirección pueden revisar o editar un documento ajeno. */
export function exigirGestionDeDocumentos(actor: Actor): void {
  if (!puedeGestionarDocumentos(actor)) {
    throw new NoAutorizado('No tenés permisos para revisar documentos')
  }
}

/** El estado efectivo de la Postulación, leyendo el vencimiento perezoso. */
export function estadoEfectivo(postulacion: Postulacion, ahora: Date): EstadoPostulacion {
  return postulacion.estadoEn(ahora)
}

export function admitenDocumentos(estado: EstadoPostulacion): boolean {
  return (ESTADOS_QUE_ADMITEN_DOCUMENTOS as readonly string[]).includes(estado)
}

export function yaEstaValidada(estado: EstadoPostulacion): boolean {
  return estado === 'DOCUMENTACION_VALIDADA' || estado === 'CONFIRMADO_PARA_EXPORTAR'
}

/**
 * Mueve la Postulación a la etapa que corresponde según el conjunto actual de
 * documentos. La primera barrera de autorización ya la puso el caso de uso; la
 * RPC real vuelve a validar.
 */
export async function recalcularEtapaDeDocumentacion(
  postulacionId: string,
  acciones: AccionesDeDocumentacion,
  postulaciones: RepositorioDePostulaciones,
  documentos: Documento[],
  reloj: Reloj,
): Promise<void> {
  const ahora = reloj.ahora()
  const postulacion = await postulaciones.obtenerPorId(postulacionId)
  if (!postulacion) throw new NoEncontrado('La Postulación no existe')

  const actual = postulacion.estadoEn(ahora)
  const observado = documentos.some((d) => d.estado === 'OBSERVADO')
  const todosAprobados =
    documentos.length > 0 && documentos.every((d) => d.estado === 'APROBADO')

  const objetivo: EstadoPostulacion = observado
    ? 'OBSERVADO'
    : todosAprobados
      ? 'DOCUMENTACION_VALIDADA'
      : 'DOCUMENTACION_EN_REVISION'

  if (actual === objetivo) return
  if (yaEstaValidada(actual)) {
    throw new ConflictoDeEstado('La documentación ya fue validada; no se puede reabrir')
  }
  if (!admitenDocumentos(actual)) {
    throw new ConflictoDeEstado('La Postulación todavía no está en la etapa de documentación')
  }

  let etapa = actual

  if (etapa === 'VACANTE_CONFIRMADA') {
    await transicionar(postulacionId, 'ESPERANDO_DOCUMENTACION', acciones)
    etapa = 'ESPERANDO_DOCUMENTACION'
  }

  if (etapa !== 'DOCUMENTACION_EN_REVISION') {
    await transicionar(postulacionId, 'DOCUMENTACION_EN_REVISION', acciones)
    etapa = 'DOCUMENTACION_EN_REVISION'
  }

  if (objetivo !== 'DOCUMENTACION_EN_REVISION') {
    await transicionar(postulacionId, objetivo, acciones)
  }
}

export async function transicionar(
  postulacionId: string,
  hacia: EstadoPostulacion,
  acciones: AccionesDeDocumentacion,
): Promise<void> {
  const resultado = await acciones.transicionar(postulacionId, hacia)

  if (resultado === 'OK') return
  if (resultado === 'NO_ENCONTRADA') throw new NoEncontrado('La Postulación no existe')
  if (resultado === 'NO_AUTORIZADO') throw new NoAutorizado('No podés cambiar la documentación')
  if (resultado === 'TRANSICION_INVALIDA') {
    throw new ConflictoDeEstado('La Postulación no puede pasar a esa etapa de documentación')
  }

  throw new ConflictoDeEstado()
}
