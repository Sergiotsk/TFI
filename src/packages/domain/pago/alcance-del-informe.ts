import { ocupaCupo } from '../postulacion/estados'
import type { Postulacion } from '../postulacion/postulacion'

/** Por qué una fila del informe de SysAdmin no es asunto de la admisión (ADR 0011). */
export const MOTIVOS_IGNORADO = ['SIN_POSTULACION', 'YA_ADMITIDO'] as const
export type MotivoIgnorado = (typeof MOTIVOS_IGNORADO)[number]

/**
 * Decide si la admisión ignora un pago del informe, según las Postulaciones del DNI que lo pagó.
 *
 * El informe trae también las cuotas de los alumnos que ya cursan: si el DNI no tiene Postulaciones,
 * o todas ya ocupan cupo, el pago no es una seña y se ignora. Si alguna todavía espera el pago, sigue
 * el camino de siempre (`evaluarPago`).
 */
export function motivoParaIgnorar(postulaciones: readonly Postulacion[]): MotivoIgnorado | null {
  if (postulaciones.length === 0) return 'SIN_POSTULACION'
  if (postulaciones.every((postulacion) => ocupaCupo(postulacion.estado))) return 'YA_ADMITIDO'
  return null
}
