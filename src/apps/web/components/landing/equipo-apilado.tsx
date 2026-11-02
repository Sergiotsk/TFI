'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/** Cuánto se scrollea para que entre cada card, como fracción del alto de la ventana. */
const PASO = 0.7
/** Cuántas cards se pueden ver apiladas detrás de la del frente. */
const CAPAS = 3
/** Cuánto entra desde la derecha cada card nueva, en % de su propio ancho. */
const ENTRADA = 60

/**
 * Cards del equipo que se apilan al bajar: la sección queda "pegada" arriba y cada card
 * entra desde la derecha y se posa sobre la anterior, mientras las de abajo se achican
 * y se corren un poco hacia arriba. Al subir, todo se destapa en orden inverso.
 *
 * La animación es solo una lectura de la posición del scroll: no secuestra la rueda, no
 * usa librerías y el alto extra de la sección sale de la cantidad de cards. Con "reducir
 * movimiento" o en pantallas angostas no se activa y las cards quedan en la lista normal,
 * una debajo de otra (el marcado es el mismo, solo cambia el CSS).
 */
export function EquipoApilado({ children }: { children: ReactNode }) {
  const marco = useRef<HTMLDivElement>(null)
  const lista = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const contenedor = marco.current
    const ul = lista.current
    if (!contenedor || !ul) return

    const tarjetas = Array.from(ul.children).filter(
      (hijo): hijo is HTMLElement => hijo instanceof HTMLElement,
    )
    if (tarjetas.length < 2) return

    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)')
    const ancho = window.matchMedia('(min-width: 720px)')

    let activo = false
    let recorrido = 0
    let pendiente = false
    // Último transform escrito por card, para no tocar el DOM si no cambió.
    const ultimo: string[] = []

    const acotar = (valor: number) => Math.min(1, Math.max(0, valor))

    const medir = () => {
      if (!activo) return
      const alto = window.innerHeight
      const paso = Math.round(alto * PASO)
      contenedor.style.height = `${alto + (tarjetas.length - 1) * paso}px`
      recorrido = Math.max(0, contenedor.offsetHeight - alto)
    }

    const pintar = () => {
      if (!activo) return
      const caja = contenedor.getBoundingClientRect()
      const avance = recorrido > 0 ? acotar(-caja.top / recorrido) : 0
      // Posición dentro de la pila: 0 = primera card al frente, n-1 = última.
      const frente = avance * (tarjetas.length - 1)

      tarjetas.forEach((tarjeta, i) => {
        const entrada = i === 0 ? 1 : acotar(frente - (i - 1))
        const tapada = Math.min(CAPAS, Math.max(0, frente - i))
        const transform = `translate3d(${((1 - entrada) * ENTRADA).toFixed(2)}%, ${(-tapada * 14).toFixed(1)}px, 0) scale(${((0.92 + 0.08 * entrada) * (1 - 0.02 * tapada)).toFixed(3)})`
        if (ultimo[i] === transform) return
        ultimo[i] = transform
        tarjeta.style.transform = transform
      })
    }

    const pedirPintado = () => {
      if (pendiente) return
      pendiente = true
      window.requestAnimationFrame(() => {
        pendiente = false
        pintar()
      })
    }

    const activar = () => {
      const corresponde = ancho.matches && !reducir.matches
      if (corresponde === activo) return
      activo = corresponde

      if (!activo) {
        delete contenedor.dataset.animado
        contenedor.style.height = ''
        tarjetas.forEach((tarjeta, i) => {
          tarjeta.style.transform = ''
          ultimo[i] = ''
        })
        return
      }

      contenedor.dataset.animado = 'si'
      ultimo.length = 0
      medir()
      pintar()
    }

    const alRedimensionar = () => {
      medir()
      pedirPintado()
    }

    activar()
    window.addEventListener('scroll', pedirPintado, { passive: true })
    window.addEventListener('resize', alRedimensionar)
    ancho.addEventListener('change', activar)
    reducir.addEventListener('change', activar)

    return () => {
      window.removeEventListener('scroll', pedirPintado)
      window.removeEventListener('resize', alRedimensionar)
      ancho.removeEventListener('change', activar)
      reducir.removeEventListener('change', activar)
      delete contenedor.dataset.animado
      contenedor.style.height = ''
    }
  }, [])

  return (
    <div className='equipo-pila' ref={marco}>
      <ul className='equipo equipo--full equipo--pila' ref={lista}>
        {children}
      </ul>
    </div>
  )
}
