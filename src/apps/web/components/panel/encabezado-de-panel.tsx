import type { ReactNode } from 'react'

// Título de cada panel. La navegación y el cierre de sesión los pone el layout: la barra lateral en el personal y
// el encabezado en el aspirante. En el personal (data-panel) no hay franja blanca: el título va sobre el fondo
// temático, más grande y en el color de marca.
interface EncabezadoDePanelProps {
  area: string
  titulo: string
  descripcion?: string
  acciones?: ReactNode
}

export function EncabezadoDePanel({ area, titulo, descripcion, acciones }: EncabezadoDePanelProps) {
  return (
    <header className="border-b border-border bg-card in-data-[panel=personal]:border-0 in-data-[panel=personal]:bg-transparent">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-7 sm:px-6 lg:px-8 in-data-[panel=personal]:pt-9 in-data-[panel=personal]:pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <span className="block text-xs font-bold tracking-widest text-primary uppercase in-data-[panel=personal]:text-[13px] in-data-[panel=personal]:font-extrabold in-data-[panel=personal]:tracking-[0.8px]">
              {area}
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem] in-data-[panel=personal]:font-semibold in-data-[panel=personal]:tracking-normal in-data-[panel=personal]:text-primary sm:in-data-[panel=personal]:text-[30px] sm:in-data-[panel=personal]:leading-9">
              {titulo}
            </h1>
            {descripcion ? (
              <p className="text-sm text-muted-foreground in-data-[panel=personal]:text-base in-data-[panel=personal]:text-foreground">
                {descripcion}
              </p>
            ) : null}
          </div>
          {acciones ? <div className="flex flex-wrap gap-2">{acciones}</div> : null}
        </div>
      </div>
    </header>
  )
}
