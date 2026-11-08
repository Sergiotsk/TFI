'use client'

import { useFormStatus } from 'react-dom'
import { cerrarSesion } from '@/app/panel/actions'

export function BotonCerrarSesion() {
  return (
    <form action={cerrarSesion}>
      <Boton />
    </form>
  )
}

function Boton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:pointer-events-none disabled:opacity-50"
    >
      {pending ? 'Cerrando…' : 'Cerrar sesión'}
    </button>
  )
}
