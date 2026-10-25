'use client'

/* eslint-disable @next/next/no-img-element -- la foto es opcional: si no existe, se ve la inicial */

import { cn } from '@/lib/utils'
import { useImagenCargada } from './use-imagen-cargada'

/** Avatar de cada integrante: si no hay foto, queda la inicial del nombre. */
export function AvatarPersona({ nombre, foto }: { nombre: string; foto: string }) {
  const cargada = useImagenCargada(foto)
  return (
    <div className={cn('persona__foto', cargada && 'tiene-imagen')}>
      <span className="persona__inicial" aria-hidden="true">
        {nombre.charAt(0)}
      </span>
      <img src={foto} alt={`Foto de ${nombre}`} hidden={!cargada} />
    </div>
  )
}
