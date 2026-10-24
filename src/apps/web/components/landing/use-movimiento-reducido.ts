'use client'

import { useSyncExternalStore } from 'react'

function suscribirse(alCambiar: () => void) {
  const consulta = window.matchMedia('(prefers-reduced-motion: reduce)')
  consulta.addEventListener('change', alCambiar)
  return () => consulta.removeEventListener('change', alCambiar)
}

function leerDelNavegador() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * ¿La persona pidió reducir el movimiento? En el servidor se asume que sí (todo visible, sin animar)
 * y después el navegador decide.
 */
export function useMovimientoReducido(): boolean {
  return useSyncExternalStore(suscribirse, leerDelNavegador, () => true)
}
