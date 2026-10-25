'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Lista de pasos de "Cómo funciona" con una línea de carga atada al scroll.
 *
 * Al bajar, la línea se va llenando junto con el scroll (pasando de un círculo al siguiente);
 * al subir, se vacía en sentido inverso; y al volver a bajar, se llena otra vez. No bloquea el
 * scroll: cuando la línea llega al final, la página sigue de largo con normalidad.
 *
 * Los <li> llegan de la página (server component) como hijos. Este componente solo mide y
 * actualiza dos cosas: la variable CSS --avance (0 a 1) del <ol> y la clase `is-alcanzado` de
 * cada paso. El aspecto lo define landing.css.
 */
export function PasosConScroll({ children }: { children: ReactNode }) {
  const lista = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const ol = lista.current
    if (!ol) return
    const pasos = Array.from(ol.querySelectorAll<HTMLElement>(':scope > li'))
    if (pasos.length === 0) return

    // Con "reducir movimiento" la línea queda completa y no se anima.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      ol.style.setProperty('--avance', '1')
      pasos.forEach((paso) => paso.classList.add('is-alcanzado'))
      return
    }

    // Distancia (en px) desde el borde superior del <ol> hasta el centro de cada círculo (2.25rem de alto).
    let centros: number[] = []
    let primero = 0
    let largo = 0

    const medir = () => {
      const mitadDelCirculo = parseFloat(getComputedStyle(document.documentElement).fontSize) * 1.125
      centros = pasos.map((paso) => paso.offsetTop + mitadDelCirculo)
      primero = centros[0] ?? 0
      largo = (centros[centros.length - 1] ?? 0) - primero
      ol.style.setProperty('--linea-alto', `${largo}px`)
    }

    let pendiente = false
    const actualizar = () => {
      pendiente = false
      // "Línea de lectura": el punto de la pantalla hasta donde se llena la línea (60% de la altura).
      const lectura = window.innerHeight * 0.6
      const recorrido = lectura - (ol.getBoundingClientRect().top + primero)
      const lleno = Math.min(Math.max(recorrido, 0), largo)
      ol.style.setProperty('--avance', String(largo > 0 ? lleno / largo : 0))
      pasos.forEach((paso, i) => {
        paso.classList.toggle('is-alcanzado', recorrido >= (centros[i] ?? 0) - primero)
      })
    }
    const pedirActualizacion = () => {
      if (pendiente) return
      pendiente = true
      window.requestAnimationFrame(actualizar)
    }

    medir()
    actualizar()
    window.addEventListener('scroll', pedirActualizacion, { passive: true })
    window.addEventListener('resize', pedirActualizacion)
    const observador = new ResizeObserver(() => {
      medir()
      pedirActualizacion()
    })
    observador.observe(ol)

    return () => {
      window.removeEventListener('scroll', pedirActualizacion)
      window.removeEventListener('resize', pedirActualizacion)
      observador.disconnect()
    }
  }, [])

  return (
    <ol className="pasos" ref={lista}>
      {children}
    </ol>
  )
}
