'use client'

/* eslint-disable @next/next/no-img-element -- la imagen es opcional: si no existe, el encabezado queda solo azul */

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { IMG_SEDE_PORTADA } from '@/lib/landing/datos'
import { useImagenCargada } from './use-imagen-cargada'

/**
 * Encabezado celeste de Institución. Si existe la imagen de la sede, se ve del lado derecho
 * y se funde con el azul mediante un degradado; se mueve apenas con el scroll (parallax).
 */
export function PortadaSede({ children }: { children: ReactNode }) {
  const hayImagen = useImagenCargada(IMG_SEDE_PORTADA)

  return (
    <div
      className={cn(
        'banda-azul cabecera-vista',
        hayImagen && 'cabecera-vista--con-imagen',
      )}
      data-parallax='0.06'
    >
      {hayImagen ? (
        <div className='cabecera-vista__imagen' aria-hidden='true'>
          <img src={IMG_SEDE_PORTADA} alt='' />
        </div>
      ) : null}
      <div className='container cabecera-vista__contenido'>{children}</div>
    </div>
  )
}
