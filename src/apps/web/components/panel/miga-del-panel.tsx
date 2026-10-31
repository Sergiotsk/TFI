'use client'

import { usePathname } from 'next/navigation'
import { ETIQUETAS_DE_ROL } from '@/config/institucion'
import { itemActivoDelMenu, type RolDelPersonal } from '@/config/paneles'

// Dónde está parado el personal, en la barra de arriba: "Secretaría TUP › Postulaciones".
export function MigaDelPanel({ rol }: { rol: RolDelPersonal }) {
  const activo = itemActivoDelMenu(rol, usePathname())

  return (
    <nav aria-label="Ubicación" className="min-w-0 truncate text-sm text-muted-foreground">
      {ETIQUETAS_DE_ROL[rol]}
      {activo ? (
        <>
          <span aria-hidden="true" className="mx-1.5">
            ›
          </span>
          <span aria-current="page" className="font-medium text-foreground">
            {activo.etiqueta}
          </span>
        </>
      ) : null}
    </nav>
  )
}
