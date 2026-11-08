'use client'

import { useActionState, type ComponentProps, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import type { EstadoDeAccion } from '@/app/(paneles)/sesion-de-panel'

interface FormularioDeAccionProps {
  accion: (anterior: EstadoDeAccion, datos: FormData) => Promise<EstadoDeAccion>
  /** Valores fijos que viajan con el envío (ids). */
  ocultos: Record<string, string>
  etiqueta: string
  variante?: ComponentProps<typeof Button>['variant']
  tamano?: ComponentProps<typeof Button>['size']
  /** Ícono delante de la etiqueta; mientras se envía no se muestra. */
  icono?: ReactNode
  /** Campos visibles extra (por ejemplo, los días de una prórroga). */
  children?: ReactNode
}

// Formulario de una acción de servidor con estado de envío y resultado. Las reglas las decide el caso de uso.
export function FormularioDeAccion({
  accion,
  ocultos,
  etiqueta,
  variante,
  tamano,
  icono,
  children,
}: FormularioDeAccionProps) {
  const [estado, ejecutar, enviando] = useActionState(accion, null)

  return (
    <form action={ejecutar} className="flex flex-wrap items-end gap-2">
      {Object.entries(ocultos).map(([nombre, valor]) => (
        <input key={nombre} type="hidden" name={nombre} value={valor} />
      ))}
      {children}
      <Button type="submit" variant={variante} size={tamano} disabled={enviando}>
        {enviando ? null : icono}
        {enviando ? 'Enviando…' : etiqueta}
      </Button>
      {estado ? (
        <p
          role={estado.ok ? 'status' : 'alert'}
          className={estado.ok ? 'w-full text-xs text-primary' : 'w-full text-xs text-destructive'}
        >
          {estado.mensaje}
        </p>
      ) : null}
    </form>
  )
}
