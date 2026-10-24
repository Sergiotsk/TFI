'use client'

/* eslint-disable @next/next/no-img-element -- la imagen del logo es opcional: si no existe, se ve el marcador */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { IMG_LOGO, NAVEGACION, PROYECTO_NOMBRE, SISTEMA_URL } from '@/lib/landing/datos'
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

export function Encabezado() {
  const [abierto, setAbierto] = useState(false)
  const rutaActual = usePathname()

  return (
    <header className="site-header">
      <div className="container site-header__barra">
        <Marca />

        <button
          className="nav-toggle"
          type="button"
          aria-expanded={abierto}
          aria-controls="menu-principal"
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
          <a className="btn btn--primary btn--chico" href={SISTEMA_URL}>
            Ir al sistema de inscripción
            <FlechaDerecha />
          </a>
        </nav>
      </div>
    </header>
  )
}
