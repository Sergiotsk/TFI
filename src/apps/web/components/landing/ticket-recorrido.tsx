'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useMovimientoReducido } from './use-movimiento-reducido'

const PASOS = [
  { titulo: 'Preinscripción', detalle: 'Se cargan los datos mínimos y se aceptan las condiciones.' },
  { titulo: 'Pago pendiente', detalle: 'Se elige pagar online o en ventanilla.' },
  {
    titulo: 'Vacante confirmada',
    detalle: 'El pago se acredita y la vacante queda asegurada.',
    hito: true,
  },
  { titulo: 'Documentación', detalle: 'Recién ahora se suben los documentos requeridos.' },
]

/**
 * Recorrido de una Postulación (tarjeta tipo comprobante).
 * Los pasos se encienden en orden: la línea se va llenando hacia el siguiente, el marcador
 * "salta" al activarse, una barra de avance acompaña todo el recorrido y, al llegar a la
 * vacante confirmada, el sello emite un pulso.
 */
export function TicketRecorrido() {
  const sinMovimiento = useMovimientoReducido()
  const [alcanzado, setAlcanzado] = useState(0)
  // Cada "ciclo" vuelve a programar los temporizadores del recorrido.
  const [ciclo, setCiclo] = useState(0)

  useEffect(() => {
    if (sinMovimiento) return
    const temporizadores = PASOS.map((_, i) =>
      window.setTimeout(() => setAlcanzado(i + 1), 700 + i * 1100),
    )
    return () => temporizadores.forEach((t) => clearTimeout(t))
  }, [sinMovimiento, ciclo])

  const pasosAlcanzados = sinMovimiento ? PASOS.length : alcanzado
  const completo = pasosAlcanzados === PASOS.length

  return (
    <aside
      className={cn('ticket', sinMovimiento ? '' : 'is-listo')}
      aria-label="Recorrido de una Postulación"
    >
      <div className="ticket__cabecera">
        <p className="ticket__titulo">Recorrido de una Postulación</p>
        <span className="pill">Ejemplo</span>
      </div>

      <div className="ticket__progreso" aria-hidden="true">
        <span
          className={cn('ticket__progreso-barra', completo && 'is-completo')}
          style={{ transform: `scaleX(${pasosAlcanzados / PASOS.length})` }}
        />
      </div>

      <ol className="ticket__lista">
        {PASOS.map((paso, i) => (
          <li
            key={paso.titulo}
            className={cn(
              'ticket__paso',
              paso.hito && 'ticket__paso--hito',
              i < pasosAlcanzados && 'is-alcanzado',
            )}
          >
            <span className="ticket__marca" aria-hidden="true">
              {paso.hito ? (
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              ) : null}
            </span>
            <div className="ticket__texto">
              <strong>{paso.titulo}</strong>
              <span>{paso.detalle}</span>
            </div>
          </li>
        ))}
      </ol>
      {sinMovimiento ? null : (
        <button
          type="button"
          className="ticket__repetir"
          onClick={() => {
            setAlcanzado(0)
            setCiclo((c) => c + 1)
          }}
        >
          Ver de nuevo
        </button>
      )}
    </aside>
  )
}
