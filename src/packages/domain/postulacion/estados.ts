// Todos los estados existen en el enum, pero las transiciones posteriores a VACANTE_CONFIRMADA
// quedan fuera de esta feature (research R9).
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

export type EstadoDePostulacion = (typeof ESTADOS_DE_POSTULACION)[number]

// Para la ocupación de cupos cuentan VACANTE_CONFIRMADA y todos los posteriores.
export const ESTADOS_QUE_OCUPAN_CUPO = [
  'VACANTE_CONFIRMADA',
  'ESPERANDO_DOCUMENTACION',
  'DOCUMENTACION_EN_REVISION',
  'OBSERVADO',
  'DOCUMENTACION_VALIDADA',
  'CONFIRMADO_PARA_EXPORTAR',
] as const satisfies readonly EstadoDePostulacion[]

export const MOTIVOS_DE_REVISION = ['FUERA_DE_PLAZO', 'SIN_CUPO'] as const

export type MotivoDeRevision = (typeof MOTIVOS_DE_REVISION)[number]

export function ocupaCupo(estado: EstadoDePostulacion): boolean {
  return (ESTADOS_QUE_OCUPAN_CUPO as readonly EstadoDePostulacion[]).includes(estado)
}
