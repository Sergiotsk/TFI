'use client'

import { useState, type ComponentProps } from 'react'
import { Button } from '@/components/ui/button'

// Botón de una maqueta: no llama a nada. Al tocarlo avisa que la acción todavía no está conectada al backend,
// así nadie confunde la pantalla con funcionalidad real. Se reemplaza por la llamada al endpoint cuando exista.
export function AccionPendiente({ children, ...props }: ComponentProps<typeof Button>) {
  const [avisado, setAvisado] = useState(false)

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button {...props} onClick={() => setAvisado(true)}>
        {children}
      </Button>
      <span role="status" className="text-xs text-muted-foreground">
        {avisado ? 'Pendiente de backend' : null}
      </span>
    </span>
  )
}
