'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import type { EstadoDeAccion } from '@/app/(paneles)/sesion-de-panel'

interface FormularioDeDecisionProps {
  accion: (anterior: EstadoDeAccion, datos: FormData) => Promise<EstadoDeAccion>
  pagoId: string
  /** Número de la Postulación, para el aviso que muestra la página después de decidir. */
  numero: string
}

// Aceptar o rechazar un caso de Dirección, con un comentario opcional. Cada botón manda su `decision`. Si sale bien,
// la acción redirige y el aviso lo muestra la página; acá solo queda el error.
export function FormularioDeDecision({ accion, pagoId, numero }: FormularioDeDecisionProps) {
  const [estado, ejecutar, enviando] = useActionState(accion, null)

  return (
    <form action={ejecutar} className="space-y-3 border-t border-border pt-4">
      <input type="hidden" name="id" value={pagoId} />
      <input type="hidden" name="numero" value={numero} />
      <label className="block space-y-1 text-xs">
        <span className="text-muted-foreground">Comentario (opcional)</span>
        <textarea
          name="comentario"
          rows={2}
          maxLength={500}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </label>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" name="decision" value="ACEPTAR" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Aceptar pago'}
        </Button>
        <Button type="submit" name="decision" value="RECHAZAR" variant="destructive" disabled={enviando}>
          Rechazar y devolver
        </Button>
      </div>
      {estado ? (
        <p role={estado.ok ? 'status' : 'alert'} className={estado.ok ? 'text-xs text-primary' : 'text-xs text-destructive'}>
          {estado.mensaje}
        </p>
      ) : null}
    </form>
  )
}
