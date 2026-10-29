'use client'

/* eslint-disable @next/next/no-img-element -- la imagen del logo es opcional: si no existe, se ve el marcador */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { IMG_LOGO, NAVEGACION, PROYECTO_NOMBRE } from '@/lib/landing/datos'
import { FlechaDerecha } from './flecha'
import { useImagenCargada } from './use-imagen-cargada'

function Marca() {
  const cargada = useImagenCargada(IMG_LOGO)
  return (
    <Link
      href="/"
      className={cn('marca', cargada && 'tiene-imagen')}
      aria-label={`${PROYECTO_NOMBRE}, ir al inicio`}
    >
      <img
        className="marca__logo"
        src={IMG_LOGO}
        alt="UTN Facultad Regional Haedo"
        hidden={!cargada}
      />
      <span className="marca__fallback">
        <span className="marca__sello" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
          </svg>
        </span>
        <span className="marca__nombre">
          <span className="marca__sigla">
            UTN<b>.FRH</b>
          </span>
          <small>HAEDO · TUP</small>
        </span>
      </span>
    </Link>
  )
}

/**
 * El destino del sistema se recibe desde el layout (servidor): así el valor de la variable de
 * entorno es el mismo en el HTML inicial y en la hidratación del cliente.
 */
export function Encabezado({ sistemaUrl }: { sistemaUrl: string }) {
  const [abierto, setAbierto] = useState(false)
  const rutaActual = usePathname()
  const barra = useRef<HTMLElement>(null)
  const botonMenu = useRef<HTMLButtonElement>(null)

  // Cerrar con Escape (devolviendo el foco al botón) o al tocar fuera del encabezado.
  useEffect(() => {
    if (!abierto) return

    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key !== 'Escape') return
      setAbierto(false)
      botonMenu.current?.focus()
    }
    const alTocarFuera = (evento: PointerEvent) => {
      if (!barra.current?.contains(evento.target as Node)) setAbierto(false)
    }

    document.addEventListener('keydown', alTeclear)
    document.addEventListener('pointerdown', alTocarFuera)
    return () => {
      document.removeEventListener('keydown', alTeclear)
      document.removeEventListener('pointerdown', alTocarFuera)
    }
  }, [abierto])

  return (
    <header className="site-header" ref={barra}>
      <div className="container site-header__barra">
        <Marca />

        <button
          ref={botonMenu}
          className="nav-toggle"
          type="button"
          aria-expanded={abierto}
          aria-controls="menu-principal"
          aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setAbierto((v) => !v)}
        >
          Menú
        </button>

        <nav
          className={cn('menu', abierto && 'is-abierto')}
          id="menu-principal"
          aria-label="Principal"
        >
          <ul className="menu__enlaces">
            {NAVEGACION.map(({ ruta, texto }) => (
              <li key={ruta}>
                <Link
                  href={ruta}
                  aria-current={rutaActual === ruta ? 'page' : undefined}
                  onClick={() => setAbierto(false)}
                >
                  {texto}
                </Link>
              </li>
            ))}
          </ul>
          <a className="btn btn--primary btn--chico" href={sistemaUrl}>
            Ir al sistema de inscripción
            <FlechaDerecha />
          </a>
        </nav>
      </div>
    </header>
  )
}
