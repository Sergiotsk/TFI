/**
 * Los 10 estados del ciclo de vida de la Postulación.
 *
 * Es la única fuente de verdad: el tipo se deriva de la constante, así que
 * agregar un estado acá lo agrega también al tipo, a la tabla de transiciones
 * y a los `z.enum` de los bordes.
 */
export const ESTADOS_DE_POSTULACION = [
  'PREINSCRIPTO',
  'PAGO_PENDIENTE',
  'PAGO_EN_REVISION',
  'VACANTE_CONFIRMADA',
  'VENCIDO',
  'ESPERANDO_DOCUMENTACION',
  'DOCUMENTACION_EN_REVISION',
  'OBSERVADO',
  'DOCUMENTACION_VALIDADA',
  'CONFIRMADO_PARA_EXPORTAR',
] as const

export type EstadoPostulacion = (typeof ESTADOS_DE_POSTULACION)[number]

/**
 * Estados que ocupan una vacante (data-model.md, "Ocupación derivada"):
 * `VACANTE_CONFIRMADA` y todos los posteriores.
 */
export const ESTADOS_QUE_OCUPAN_CUPO = [
  'VACANTE_CONFIRMADA',
  'ESPERANDO_DOCUMENTACION',
  'DOCUMENTACION_EN_REVISION',
  'OBSERVADO',
  'DOCUMENTACION_VALIDADA',
  'CONFIRMADO_PARA_EXPORTAR',
] as const

export function ocupaCupo(estado: EstadoPostulacion): boolean {
  return (ESTADOS_QUE_OCUPAN_CUPO as readonly EstadoPostulacion[]).includes(estado)
}

/**
 * Transiciones válidas de la máquina de estados (data-model.md).
 *
 * `PAGO_PENDIENTE -> VENCIDO` no la escribe nadie: la deriva `estadoEn(ahora)`
 * cuando el plazo pasó. Las transiciones de documentación existen en el grafo
 * pero su lógica queda para otra feature (research R9).
 */
export const TRANSICIONES: Record<EstadoPostulacion, readonly EstadoPostulacion[]> = {
  PREINSCRIPTO: ['PAGO_PENDIENTE'],
  PAGO_PENDIENTE: ['VENCIDO', 'VACANTE_CONFIRMADA', 'PAGO_EN_REVISION'],
  VENCIDO: ['PAGO_PENDIENTE', 'VACANTE_CONFIRMADA', 'PAGO_EN_REVISION'],
  PAGO_EN_REVISION: ['VACANTE_CONFIRMADA', 'VENCIDO'],
  VACANTE_CONFIRMADA: ['ESPERANDO_DOCUMENTACION'],
  ESPERANDO_DOCUMENTACION: ['DOCUMENTACION_EN_REVISION'],
  DOCUMENTACION_EN_REVISION: ['OBSERVADO', 'DOCUMENTACION_VALIDADA'],
  OBSERVADO: ['DOCUMENTACION_EN_REVISION'],
  DOCUMENTACION_VALIDADA: ['CONFIRMADO_PARA_EXPORTAR'],
  CONFIRMADO_PARA_EXPORTAR: [],
}
