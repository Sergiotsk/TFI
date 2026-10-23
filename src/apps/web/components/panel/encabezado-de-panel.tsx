import type { ReactNode } from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'

// La navegación entre paneles y el cierre de sesión viven en la barra lateral (components/panel/barra-lateral.tsx).
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
        <SidebarTrigger className="-ml-1" />
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
