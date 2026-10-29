'use client'

import { useEffect } from 'react'

/**
 * Cuánto del recorrido pendiente se consume por cuadro. Más bajo = más suave y lento;
 * más alto = más directo. Rango recomendado: 0.08 (muy suave) a 0.18 (casi inmediato).
 */
const SUAVIDAD = 0.07

/**
 * Suaviza la rueda del mouse en la landing con una inercia corta (sin librerías).
 *
 * Decisiones para no secuestrar el scroll:
 *  - Solo se activa con puntero fino y si el visitante no pidió reducir movimiento.
 *  - El teclado, la barra de scroll y los gestos táctiles siguen siendo nativos: si el usuario
 *    scrollea por otra vía, la animación se cancela y se sincroniza con la posición real.
 *  - Si el gesto nace dentro de un contenedor con scroll propio, se deja pasar sin tocarlo.
 *  - Se usa `behavior: 'instant'` en cada cuadro para que el `scroll-behavior: smooth` de las
 *    anclas no compita con esta animación.
 */
export function ScrollSuave() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!window.matchMedia('(pointer: fine)').matches) return

    const raiz = document.documentElement
    let objetivo = window.scrollY
    let actual = window.scrollY
    let aplicado = window.scrollY
    let cuadro = 0
    let ultimoTiempo = 0

    const aplicar = () => {
      const y = Math.round(actual * 100) / 100
      window.scrollTo({ top: y, behavior: 'instant' })
      aplicado = y
    }

    const animar = (tiempo: number) => {
      // Factor normalizado por tiempo: la inercia se siente igual a 60, 90 o 120 Hz.
      const delta = ultimoTiempo ? Math.min(64, tiempo - ultimoTiempo) : 16.67
      ultimoTiempo = tiempo
      const factor = 1 - Math.pow(1 - SUAVIDAD, delta / 16.67)
      actual += (objetivo - actual) * factor

      if (Math.abs(objetivo - actual) < 0.4) {
        actual = objetivo
        aplicar()
        cuadro = 0
        ultimoTiempo = 0
        return
      }

      aplicar()
      cuadro = window.requestAnimationFrame(animar)
    }

    const arrancar = () => {
      if (cuadro) return
      ultimoTiempo = 0
      cuadro = window.requestAnimationFrame(animar)
    }

    const maximo = () => Math.max(0, raiz.scrollHeight - window.innerHeight)

    const normalizar = (evento: WheelEvent) => {
      if (evento.deltaMode === 1) return evento.deltaY * 16
      if (evento.deltaMode === 2) return evento.deltaY * window.innerHeight
      return evento.deltaY
    }

    const hayScrollPropio = (destino: EventTarget | null, delta: number) => {
      if (!(destino instanceof Element)) return false
      if (destino.closest('input, textarea, select, [contenteditable="true"]'))
        return true

      let nodo: Element | null = destino
      while (nodo && nodo !== document.body && nodo !== raiz) {
        const overflow = window.getComputedStyle(nodo).overflowY
        const scrolleable =
          overflow === 'auto' || overflow === 'scroll' || overflow === 'overlay'
        if (scrolleable && nodo.scrollHeight > nodo.clientHeight + 1) {
          const puedeBajar =
            delta > 0 &&
            nodo.scrollTop + nodo.clientHeight < nodo.scrollHeight - 1
          const puedeSubir = delta < 0 && nodo.scrollTop > 0
          if (puedeBajar || puedeSubir) return true
        }
        nodo = nodo.parentElement
      }
      return false
    }

    const alRueda = (evento: WheelEvent) => {
      if (
        evento.defaultPrevented ||
        evento.ctrlKey ||
        evento.metaKey ||
        evento.altKey
      )
        return
      if (
        evento.deltaY === 0 ||
        Math.abs(evento.deltaY) <= Math.abs(evento.deltaX)
      )
        return

      const delta = normalizar(evento)
      if (hayScrollPropio(evento.target, delta)) return

      const limite = maximo()
      if (limite <= 0) return

      if (!cuadro) {
        actual = window.scrollY
        objetivo = actual
      }

      const siguiente = Math.min(limite, Math.max(0, objetivo + delta))
      // En el extremo, se devuelve el gesto al navegador en lugar de bloquearlo.
      if (siguiente === objetivo) return

      evento.preventDefault()
      objetivo = siguiente
      arrancar()
    }

    const alScrollear = () => {
      if (!cuadro) {
        objetivo = window.scrollY
        actual = objetivo
        aplicado = objetivo
        return
      }

      // Un salto que no vino de esta animación (teclado, barra, ancla) gana siempre.
      if (Math.abs(window.scrollY - aplicado) > 2) {
        window.cancelAnimationFrame(cuadro)
        cuadro = 0
        ultimoTiempo = 0
        actual = window.scrollY
        objetivo = actual
        aplicado = actual
      }
    }

    window.addEventListener('wheel', alRueda, { passive: false })
    window.addEventListener('scroll', alScrollear, { passive: true })
    window.addEventListener('resize', alScrollear)

    return () => {
      window.removeEventListener('wheel', alRueda)
      window.removeEventListener('scroll', alScrollear)
      window.removeEventListener('resize', alScrollear)
      if (cuadro) window.cancelAnimationFrame(cuadro)
    }
  }, [])

  return null
}
