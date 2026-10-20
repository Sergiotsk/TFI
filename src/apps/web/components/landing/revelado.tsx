'use client'

import { useEffect } from 'react'

/**
 * Aparición suave de las secciones al hacer scroll.
 * Si el visitante pidió reducir movimiento, no hace nada (todo se ve de entrada).
 * Va una instancia por página: se monta de nuevo en cada navegación.
 */
export function Revelado() {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    document.documentElement.classList.add('reveal-on')
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (entrada.isIntersecting) {
            entrada.target.classList.add('is-visible')
            observador.unobserve(entrada.target)
          }
        })
      },
      { threshold: 0.12 },
    )
    document.querySelectorAll('.reveal').forEach((el) => observador.observe(el))

    return () => {
      observador.disconnect()
      document.documentElement.classList.remove('reveal-on')
    }
  }, [])

  return null
}
