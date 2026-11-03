'use client'

import { useImagenesCargadas } from './use-imagen-cargada'

/**
 * Imagen opcional del lado derecho del hero de Contacto, semitransparente y fundida con el azul.
 * Se toma el primer archivo que exista de la lista (cualquiera de estas extensiones); si no hay
 * ninguno, el hero queda como siempre, solo azul. Es decorativa (aria-hidden).
 * Para moverla con el scroll, el contenedor del hero lleva data-parallax (lo maneja Revelado).
 */
const CANDIDATAS: readonly string[] = [
  '/landing/img/contacto-hero.jpg',
  '/landing/img/contacto-hero.webp',
  '/landing/img/contacto-hero.png',
  '/landing/img/contacto-hero.jpeg',
]

export function ImagenHero() {
  const disponibles = useImagenesCargadas(CANDIDATAS)
  const src = disponibles[0]
  if (!src) return null

  return (
    <div className='hero-imagen' aria-hidden='true'>
      <img src={src} alt='' />
    </div>
  )
}
