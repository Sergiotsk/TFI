import type { Dni } from '../perfil/dni'
import type { MotivoNoImputado, PagoInformado } from '../pago/pago'
import type { PeriodoDeIngreso } from '../periodo/periodo-de-ingreso'
import { ocupaCupo, type MotivoDeRevision } from './estados'
import type { Postulacion } from './postulacion'

/** Una Postulación candidata a recibir el pago, junto con el DNI de su aspirante (para contrastar). */
export interface Candidata {
  readonly postulacion: Postulacion
  readonly dniDelAspirante: Dni
}

/** Con qué se buscaron las candidatas: por número de postulación o por DNI. */
export interface Imputacion {
  readonly via: 'NUMERO' | 'DNI'
  readonly candidatas: readonly Candidata[]
}

/** Estados persistidos desde los que un pago puede confirmar o pasar a revisión. */
export type EstadoEsperado = 'PAGO_PENDIENTE' | 'VENCIDO'

export type DecisionDeAcreditacion =
  | { readonly tipo: 'CONFIRMAR'; readonly postulacionId: string; readonly estadoEsperado: EstadoEsperado }
  | {
      readonly tipo: 'REVISION'
      readonly postulacionId: string
      readonly estadoEsperado: EstadoEsperado
      readonly motivo: MotivoDeRevision
    }
  | { readonly tipo: 'NO_IMPUTAR'; readonly motivo: MotivoNoImputado; readonly postulacionId?: string }

/**
 * Decide qué hacer con un pago informado. Reglas de data-model.md, en orden (la primera que aplica gana).
 * `ocupados` son las vacantes confirmadas del período. La idempotencia (referencia repetida) se resuelve antes,
 * en el registro de pagos.
 *
 * Se usa el estado PERSISTIDO de la Postulación, no `estadoEn(ahora)`: lo único que cuenta para el plazo es
 * `pagadoEl` contra `venceEl`.
 */
export function evaluarPago(
  pago: PagoInformado,
  imputacion: Imputacion,
  periodo: PeriodoDeIngreso,
  ocupados: number,
): DecisionDeAcreditacion {
  // 1. Sin candidata, o más de una.
  const { candidatas } = imputacion
  if (candidatas.length === 0) {
    return { tipo: 'NO_IMPUTAR', motivo: 'REFERENCIA_DESCONOCIDA' }
  }
  const [candidata] = candidatas
  if (candidatas.length > 1 || candidata === undefined) {
    return { tipo: 'NO_IMPUTAR', motivo: 'AMBIGUA' }
  }
  const { postulacion } = candidata
  const postulacionId = postulacion.id

  // 2. Vino por número y el DNI informado no coincide. No se vincula la Postulación: el pago es de otra persona.
  if (imputacion.via === 'NUMERO' && pago.dni !== undefined && !pago.dni.igualA(candidata.dniDelAspirante)) {
    return { tipo: 'NO_IMPUTAR', motivo: 'DNI_NO_COINCIDE' }
  }

  // 3. Monto menor a la matrícula.
  if (!pago.monto.cubre(periodo.montoMatricula)) {
    return { tipo: 'NO_IMPUTAR', motivo: 'MONTO_INSUFICIENTE', postulacionId }
  }

  // 4. Ya tiene vacante (o posterior) o un pago en revisión: pago doble.
  if (ocupaCupo(postulacion.estado) || postulacion.estado === 'PAGO_EN_REVISION') {
    return { tipo: 'NO_IMPUTAR', motivo: 'YA_TIENE_PAGO', postulacionId }
  }

  // 5. Nunca inició el pago.
  const estado = postulacion.estado
  if (estado !== 'PAGO_PENDIENTE' && estado !== 'VENCIDO') {
    return { tipo: 'NO_IMPUTAR', motivo: 'SIN_PAGO_INICIADO', postulacionId }
  }

  // 6. Pagó después del vencimiento (va antes que el cupo: "tardío y sin cupo" se registra FUERA_DE_PLAZO).
  if (postulacion.venceEl !== undefined && pago.pagadoEl.getTime() > postulacion.venceEl.getTime()) {
    return { tipo: 'REVISION', postulacionId, estadoEsperado: estado, motivo: 'FUERA_DE_PLAZO' }
  }

  // 7. Sin cupo.
  if (ocupados >= periodo.totalCupos) {
    return { tipo: 'REVISION', postulacionId, estadoEsperado: estado, motivo: 'SIN_CUPO' }
  }

  // 8. En plazo y con cupo.
  return { tipo: 'CONFIRMAR', postulacionId, estadoEsperado: estado }
}
