'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { IMG_LOGO } from '@/lib/landing/datos'

/**
 * Logo en 3D para el hero de Institución. Si existe `logo-utn-3d.png` se usa ese archivo (conviene
 * uno de al menos 800 px de ancho, con fondo transparente); si no, se usa el logo del encabezado.
 */
const IMG_LOGO_3D = '/landing/img/logo-utn-3d.png'

/** Cantidad de capas apiladas en profundidad: dan el grosor del logo. */
const CAPAS = 16

function useLogoDisponible(): string | null {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    const probar = (url: string, siFalla?: () => void) => {
      const prueba = new Image()
      prueba.onload = () => {
        if (vivo) setSrc(url)
      }
      prueba.onerror = () => siFalla?.()
      prueba.src = url
    }
    probar(IMG_LOGO_3D, () => probar(IMG_LOGO))
    return () => {
      vivo = false
    }
  }, [])

  return src
}

/**
 * Logo de la UTN con aspecto 3D, flotando y girando apenas. Es decorativo (aria-hidden).
 *
 * El volumen se logra apilando copias del mismo logo en profundidad (cada una un poco más atrás y
 * más oscura) dentro de un contenedor con perspectiva; la copia del frente lleva un brillo suave.
 * Los movimientos (flotar y girar) están en el CSS y se anulan con "reducir movimiento".
 */
export function LogoFlotante() {
  const src = useLogoDisponible()
  if (!src) return null

  return (
    <div className='logo3d' aria-hidden='true'>
      <div className='logo3d__flota'>
        <div className='logo3d__gira'>
          {Array.from({ length: CAPAS }, (_, i) => (
            <img
              key={i}
              className='logo3d__capa'
              src={src}
              alt=''
              style={{ '--capa': i + 1 } as CSSProperties}
            />
          ))}
          <img className='logo3d__frente' src={src} alt='' />
        </div>
      </div>
      <div className='logo3d__sombra' />
    </div>
  )
}
