'use client'

import { useEffect } from 'react'

/**
 * Efectos de scroll de la página, todos sutiles:
 *  - Aparición escalonada de las secciones (.reveal, con variantes --izq, --der y --zoom); se repite al volver a pasar.
 *  - Barra fina de progreso de lectura arriba de todo.
 *  - Parallax suave en los elementos con data-parallax="velocidad" (la trama de las bandas azules, la imagen de la sede).
 *  - El encabezado gana sombra cuando se baja (data-desplazado en <html>).
 * Si el visitante pidió reducir el movimiento, no hace nada y todo se ve de entrada.
 * Va una instancia por página: se monta de nuevo en cada navegación.
 */
export function Revelado() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const raiz = document.documentElement
    const limpiezas: Array<() => void> = []

    // 1) Aparición al entrar en pantalla
    if ('IntersectionObserver' in window) {
      raiz.classList.add('reveal-on')
      // La animación se repite: aparece al entrar (con el 12% a la vista) y se rearma recién cuando
      // el elemento salió por completo de la pantalla. Entre medio no cambia nada, para que no parpadee.
      const observador = new IntersectionObserver(
        (entradas) => {
          entradas.forEach((entrada) => {
            const muyAlto = entrada.intersectionRect.height >= window.innerHeight * 0.5
            if (entrada.intersectionRatio >= 0.12 || muyAlto) {
              entrada.target.classList.add('is-visible')
            } else if (!entrada.isIntersecting) {
              entrada.target.classList.remove('is-visible')
            }
          })
        },
        { threshold: [0, 0.12], rootMargin: '0px 0px -6% 0px' },
      )
      document.querySelectorAll('.reveal').forEach((el) => observador.observe(el))
      limpiezas.push(() => {
        observador.disconnect()
        raiz.classList.remove('reveal-on')
      })
    }

    // 2) Progreso de lectura, parallax y sombra del encabezado (un solo listener, una vez por cuadro)
    const barra = document.querySelector<HTMLElement>('.progreso-scroll')
    const conParallax = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'))
    let pendiente = false

    const actualizar = () => {
      pendiente = false
      const y = window.scrollY
      const largo = raiz.scrollHeight - window.innerHeight
      if (barra) barra.style.setProperty('--progreso', String(largo > 0 ? Math.min(1, y / largo) : 0))
      conParallax.forEach((el) => {
        const velocidad = Number(el.dataset.parallax ?? 0)
        el.style.setProperty('--py', `${Math.round(y * velocidad)}px`)
      })
      raiz.dataset.desplazado = y > 8 ? 'si' : 'no'
    }
    const alScrollear = () => {
      if (pendiente) return
      pendiente = true
      window.requestAnimationFrame(actualizar)
    }

    actualizar()
    window.addEventListener('scroll', alScrollear, { passive: true })
    window.addEventListener('resize', alScrollear)
    limpiezas.push(() => {
      window.removeEventListener('scroll', alScrollear)
      window.removeEventListener('resize', alScrollear)
      delete raiz.dataset.desplazado
    })

    return () => limpiezas.forEach((limpiar) => limpiar())
  }, [])

  return <div className="progreso-scroll" aria-hidden="true" />
}
