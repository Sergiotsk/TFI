import Link from 'next/link'
import type { ReactNode } from 'react'
import { BotonCerrarSesion } from '@/components/auth/boton-cerrar-sesion'

// Navegación entre las maquetas para recorrerlas en las revisiones. Cuando haya sesión, cada rol ve solo
// su panel y estos enlaces salen del rol del Actor.
const paneles = [
  { href: '/aspirante/postulacion', etiqueta: 'Aspirante' },
  { href: '/personal/periodos', etiqueta: 'Períodos' },
  { href: '/personal/pagos', etiqueta: 'Pagos' },
  { href: '/direccion/casos', etiqueta: 'Dirección' },
]

interface EncabezadoDePanelProps {
  area: string
  titulo: string
  descripcion?: string
  acciones?: ReactNode
}

export function EncabezadoDePanel({ area, titulo, descripcion, acciones }: EncabezadoDePanelProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <nav aria-label="Paneles" className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {paneles.map((panel) => (
              <Link key={panel.href} href={panel.href} className="text-muted-foreground hover:text-primary">
                {panel.etiqueta}
              </Link>
            ))}
          </nav>
          <BotonCerrarSesion />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <span className="block text-xs font-bold tracking-widest text-primary uppercase">{area}</span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{titulo}</h1>
            {descripcion ? <p className="text-sm text-muted-foreground">{descripcion}</p> : null}
          </div>
          {acciones ? <div className="flex flex-wrap gap-2">{acciones}</div> : null}
        </div>
      </div>
    </header>
  )
}
