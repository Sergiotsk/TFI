import type { NextResponse } from 'next/server'
import { ConflictoDeEstado, NoAutorizado, NoEncontrado } from '@tfi/application'
import {
  CuposPorDebajoDeConfirmadas,
  PeriodoCerrado,
  PostulacionDuplicada,
  SinCuposParaIniciar,
  TransicionInvalida,
} from '@tfi/domain'
import { jsonError } from './respuesta'

/**
 * Traduce los errores de dominio y de aplicación a HTTP.
 *
 * Los códigos de error son parte del contrato de `contracts/api-http.md`: la UI
 * decide qué mostrar según el `codigo`, no según el texto.
 */
export function respuestaDeErrorDePostulacion(error: unknown): NextResponse {
  if (error instanceof NoAutorizado) return jsonError('NO_AUTORIZADO', error.message, 403)
  if (error instanceof NoEncontrado) return jsonError('NO_ENCONTRADO', error.message, 404)
  if (error instanceof PeriodoCerrado) return jsonError('PERIODO_CERRADO', error.message, 409)
  if (error instanceof SinCuposParaIniciar) return jsonError('SIN_CUPOS', error.message, 409)
  if (error instanceof TransicionInvalida) {
    return jsonError('TRANSICION_INVALIDA', error.message, 409)
  }
  if (error instanceof PostulacionDuplicada) {
    return jsonError('POSTULACION_DUPLICADA', error.message, 409)
  }
  if (error instanceof CuposPorDebajoDeConfirmadas) {
    return jsonError('CUPOS_INSUFICIENTES', error.message, 409)
  }
  if (error instanceof ConflictoDeEstado) {
    return jsonError('CONFLICTO_DE_ESTADO', error.message, 409)
  }

  throw error
}
