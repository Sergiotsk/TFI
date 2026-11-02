'use client'

import type { CSSProperties } from 'react'
import { useImagenesCargadas } from './use-imagen-cargada'

/**
 * Fotos de la sede como tarjetas apiladas: cada foto queda pegada arriba (position: sticky) y se
 * achica un poco mientras la siguiente la tapa al bajar. El efecto de escala está en el CSS con
 * animaciones atadas al scroll (animation-timeline); en navegadores sin ese soporte las fotos
 * igual se apilan, solo que sin achicarse. Con "reducir movimiento" se ven como una lista común.
 *
 * Se muestran únicamente las fotos que existen, en el orden de `fotos`.
 * `fotos` tiene que ser una constante estable (declarada fuera del componente).
 */
export function SedeApilada({ fotos, alt }: { fotos: readonly string[]; alt: string }) {
  const disponibles = useImagenesCargadas(fotos)
  const total = disponibles.length

  if (total === 0) {
    return (
      <figure className='foto foto--carrusel'>
        <span className='foto__marcador'>Fotos de la Facultad</span>
      </figure>
    )
  }

  return (
    <ol
      className='sede-pila'
      aria-label='Fotos de la Facultad'
      style={{ '--total': total } as CSSProperties}
    >
      {disponibles.map((src, i) => (
        <li
          key={src}
          className='sede-pila__tarjeta'
          style={{ '--indice': i + 1 } as CSSProperties}
        >
          <figure className='sede-pila__contenido'>
            <img
              src={src}
              alt={`${alt} (foto ${i + 1} de ${total})`}
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding='async'
            />
          </figure>
        </li>
      ))}
    </ol>
  )
}
