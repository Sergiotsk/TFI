import type { Postulacion } from '@tfi/domain'

/**
 * Resultado de una acción manual del personal.
 *
 * La base es la que garantiza la atomicidad (lock del período + cupo) y la
 * autorización; el caso de uso traduce estos códigos a errores de dominio.
 */
export type ResultadoDeConfirmacion =
  | { resultado: 'OK'; postulacion: Postulacion }
  | { resultado: 'SIN_CUPO' | 'CONFLICTO' | 'NO_ENCONTRADA' | 'NO_AUTORIZADO' }

export type ResultadoDeProrroga =
  | { resultado: 'OK'; postulacion: Postulacion }
  | { resultado: 'CONFLICTO' | 'NO_ENCONTRADA' | 'NO_AUTORIZADO' | 'PERIODO_CERRADO' }

/**
 * Acciones manuales del personal sobre una Postulación.
 *
 * - `confirmarVacante` acredita un pago verificado a mano y confirma la vacante.
 *   La RPC toma el lock del período y verifica el cupo: dos confirmaciones
 *   simultáneas por el último lugar no pueden pasar las dos.
 * - `prorrogarPlazo` extiende el vencimiento o reactiva una VENCIDO. El nuevo
 *   vencimiento lo decide el caso de uso; la RPC vuelve a validar que no pase
 *   del cierre del período.
 *
 * El alcance por institución lo aplica la base (RPC y RLS), no el adaptador.
 */
export interface AccionesDelPersonal {
  confirmarVacante(postulacionId: string): Promise<ResultadoDeConfirmacion>
  prorrogarPlazo(postulacionId: string, venceEl: Date): Promise<ResultadoDeProrroga>
}
