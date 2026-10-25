'use client'

/* eslint-disable @next/next/no-img-element -- las fotos son opcionales: si no existen, se ve el marcador */

import { cn } from '@/lib/utils'
import { useImagenCargada } from './use-imagen-cargada'

/** Foto con marcador de reemplazo: si el archivo no existe, queda el texto en su lugar. */
export function FotoOpcional({
  src,
  alt,
  marcador,
  className,
}: {
  src: string
  alt: string
  marcador: string
  className?: string
}) {
  const cargada = useImagenCargada(src)
  return (
    <figure className={cn('foto', className, cargada && 'tiene-imagen')}>
      <img src={src} alt={alt} hidden={!cargada} />
      <span className="foto__marcador">{marcador}</span>
    </figure>
  )
}
