import type { LucideIcon } from 'lucide-react'

interface EstadoVacioProps {
  icono: LucideIcon
  titulo: string
  descripcion?: string
}

// Lo que muestra una bandeja o un listado del panel cuando no tiene nada.
export function EstadoVacio({ icono: Icono, titulo, descripcion }: EstadoVacioProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <span
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary"
      >
        <Icono className="size-6" />
      </span>
      <p className="text-sm font-semibold">{titulo}</p>
      {descripcion ? <p className="max-w-sm text-sm text-muted-foreground">{descripcion}</p> : null}
    </div>
  )
}
