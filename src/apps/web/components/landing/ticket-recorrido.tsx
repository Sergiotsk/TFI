'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'

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

function suscribirseAMovimientoReducido(alCambiar: () => void) {
  const consulta = window.matchMedia('(prefers-reduced-motion: reduce)')
  consulta.addEventListener('change', alCambiar)
  return () => consulta.removeEventListener('change', alCambiar)
}

function movimientoReducidoEnElNavegador() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Recorrido de una Postulación (tarjeta tipo comprobante): los pasos se encienden en orden. */
export function TicketRecorrido() {
  // En el servidor asumimos movimiento reducido (todo visible); después el navegador decide.
  const sinMovimiento = useSyncExternalStore(
    suscribirseAMovimientoReducido,
    movimientoReducidoEnElNavegador,
    () => true,
  )
  const [alcanzado, setAlcanzado] = useState(0)
  // Cada "ciclo" vuelve a programar los temporizadores del recorrido.
  const [ciclo, setCiclo] = useState(0)

  useEffect(() => {
    if (sinMovimiento) return
    const temporizadores = PASOS.map((_, i) =>
      window.setTimeout(() => setAlcanzado(i + 1), 500 + i * 800),
    )
    return () => temporizadores.forEach((t) => clearTimeout(t))
  }, [sinMovimiento, ciclo])

  const pasosAlcanzados = sinMovimiento ? PASOS.length : alcanzado

  return (
    <aside
      className={cn('ticket', sinMovimiento ? '' : 'is-listo')}
      aria-label="Recorrido de una Postulación"
    >
      <div className="ticket__cabecera">
        <p className="ticket__titulo">Recorrido de una Postulación</p>
        <span className="pill">Ejemplo</span>
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
            <div>
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
