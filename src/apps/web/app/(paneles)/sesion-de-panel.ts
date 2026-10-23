import { redirect } from 'next/navigation'
import {
  ConflictoDeEstado,
  DatosDuplicados,
  NoAutorizado,
  NoEncontrado,
  SolicitudInvalida,
  type Actor,
} from '@tfi/application'
import {
  CuposPorDebajoDeConfirmadas,
  PeriodoCerrado,
  PostulacionDuplicada,
  SinCuposParaConfirmar,
  SinCuposParaIniciar,
  TransicionInvalida,
} from '@tfi/domain'
import { crearDependencias, type Dependencias } from '@/composition-root'
import { crearCliente } from '@/lib/supabase/servidor'

/** Lo que una Server Action devuelve a su formulario: un mensaje de éxito o de error. */
export type EstadoDeAccion = { ok: boolean; mensaje: string } | null

/**
 * Arma las dependencias y el actor de la sesión, igual que los route handlers.
 * Sin sesión manda al login y sin perfil al aviso de `/panel`.
 */
export async function conActorDePanel<T>(
  usar: (dependencias: Dependencias, actor: Actor) => Promise<T>,
): Promise<T> {
  const supabase = await crearCliente()
  const dependencias = crearDependencias(supabase)
  const resultado = await dependencias.obtenerActorUseCase.ejecutar()

  if (resultado.resultado === 'SIN_SESION') redirect('/login')
  if (resultado.resultado === 'SIN_PERFIL') redirect('/panel')

  return usar(dependencias, resultado.actor)
}

/** Traduce los errores de dominio y de aplicación a un mensaje legible. Lo desconocido se relanza. */
export function mensajeDeError(error: unknown): string {
  if (error instanceof NoAutorizado) return 'No tenés permiso para hacer esto.'
  if (error instanceof PeriodoCerrado) return 'El período de ingreso está cerrado.'
  if (error instanceof SinCuposParaIniciar || error instanceof SinCuposParaConfirmar) {
    return 'El período no tiene cupos libres.'
  }
  if (error instanceof PostulacionDuplicada) {
    return 'Ya tenés una postulación activa en este período.'
  }
  if (error instanceof TransicionInvalida) {
    return 'La postulación no está en un estado que permita esta acción.'
  }
  if (
    error instanceof NoEncontrado ||
    error instanceof ConflictoDeEstado ||
    error instanceof SolicitudInvalida ||
    error instanceof DatosDuplicados ||
    error instanceof CuposPorDebajoDeConfirmadas
  ) {
    return error.message
  }

  throw error
}

/** Ejecuta una acción de panel y la convierte en el estado que muestra el formulario. */
export async function resolverAccion(accion: () => Promise<string>): Promise<EstadoDeAccion> {
  try {
    return { ok: true, mensaje: await accion() }
  } catch (error) {
    return { ok: false, mensaje: mensajeDeError(error) }
  }
}
