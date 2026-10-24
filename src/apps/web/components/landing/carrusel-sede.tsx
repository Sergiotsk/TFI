'use client'

/* eslint-disable @next/next/no-img-element -- las fotos son opcionales: si no existen, queda el marcador */

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useImagenesCargadas } from './use-imagen-cargada'
import { useMovimientoReducido } from './use-movimiento-reducido'

const INTERVALO_MS = 5000

function Flecha({ haciaLaIzquierda }: { haciaLaIzquierda?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={haciaLaIzquierda ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path d="M9 5l7 7-7 7" />
    </svg>
  )
}

/**
 * Carrusel de fotos de la Facultad: pasa solo a la siguiente cada pocos segundos.
 * Se detiene mientras el mouse o el foco están encima (y no avanza solo si la persona
 * pidió reducir el movimiento). Muestra únicamente las fotos que existen; con una sola
 * no hay controles, y sin ninguna queda un marcador.
 */
export function CarruselSede({ fotos, alt }: { fotos: readonly string[]; alt: string }) {
  const disponibles = useImagenesCargadas(fotos)
  const sinMovimiento = useMovimientoReducido()
  const [indice, setIndice] = useState(0)
  const [pausado, setPausado] = useState(false)

  const total = disponibles.length
  const actual = total > 0 ? indice % total : 0

  useEffect(() => {
    if (total < 2 || pausado || sinMovimiento) return
    // Al cambiar el índice (solo o a mano) el temporizador arranca de nuevo.
    const temporizador = window.setInterval(() => setIndice((i) => i + 1), INTERVALO_MS)
    return () => window.clearInterval(temporizador)
  }, [total, pausado, sinMovimiento, indice])

  const ir = (destino: number) => setIndice(((destino % total) + total) % total)

  if (total === 0) {
    return (
      <figure className="foto foto--carrusel">
        <span className="foto__marcador">Fotos de la Facultad</span>
      </figure>
    )
  }

  return (
    <section
      className="carrusel"
      aria-roledescription="carrusel"
      aria-label="Fotos de la Facultad"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <div className="carrusel__vista" aria-live={pausado || sinMovimiento ? 'polite' : 'off'}>
        {disponibles.map((src, i) => (
          <img
            key={src}
            className={cn('carrusel__foto', i === actual && 'is-activa')}
            src={src}
            alt={`${alt} (foto ${i + 1} de ${total})`}
            aria-hidden={i !== actual}
          />
        ))}
      </div>

      {total > 1 ? (
        <div className="carrusel__controles">
          <div className="carrusel__puntos" role="group" aria-label="Elegir foto">
            {disponibles.map((src, i) => (
              <button
                key={src}
                type="button"
                className={cn('carrusel__punto', i === actual && 'is-activa')}
                aria-label={`Ver la foto ${i + 1}`}
                aria-current={i === actual}
                onClick={() => ir(i)}
              />
            ))}
          </div>
          <div className="carrusel__flechas">
            <button type="button" aria-label="Foto anterior" onClick={() => ir(actual - 1)}>
              <Flecha haciaLaIzquierda />
            </button>
            <button type="button" aria-label="Foto siguiente" onClick={() => ir(actual + 1)}>
              <Flecha />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
