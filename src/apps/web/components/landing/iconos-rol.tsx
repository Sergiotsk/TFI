import type { ClaveDeRol } from '@/lib/landing/datos'

const TRAZO = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

/** Íconos simples de cada rol (decorativos: el nombre del rol va siempre escrito al lado). */
export function IconoRol({ rol }: { rol: ClaveDeRol }) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" {...TRAZO}>
      {rol === 'postulante' ? (
        <>
          <circle cx="12" cy="8" r="3.6" />
          <path d="M4.5 20c.6-3.6 3.5-5.6 7.5-5.6s6.9 2 7.5 5.6" />
        </>
      ) : null}
      {rol === 'secretario' ? (
        <>
          <rect x="5" y="4.5" width="14" height="16" rx="2" />
          <path d="M9 4.5V3.2h6v1.3M8.8 12.6l2.2 2.2 4.2-4.4" />
        </>
      ) : null}
      {rol === 'tesoreria' ? (
        <>
          <rect x="3.5" y="6.5" width="17" height="11" rx="2" />
          <circle cx="12" cy="12" r="2.6" />
          <path d="M7 12h.01M17 12h.01" />
        </>
      ) : null}
      {rol === 'director' ? (
        <>
          <path d="M4 20h16" />
          <rect x="5.5" y="11" width="3" height="6.5" rx=".6" />
          <rect x="10.5" y="7" width="3" height="10.5" rx=".6" />
          <rect x="15.5" y="4" width="3" height="13.5" rx=".6" />
        </>
      ) : null}
    </svg>
  )
}
