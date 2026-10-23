import type { ReactNode } from 'react'
import Link from 'next/link'

/**
 * Marco comun de las pantallas de acceso (login y registro).
 */
export function MarcoAuth({
  subtitulo,
  children,
}: {
  subtitulo: string
  children: ReactNode
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            UTN FRH
          </p>
          <h1 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
            Tecnicatura Universitaria en Programación
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitulo}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">{children}</div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="underline underline-offset-4 hover:text-foreground">
            Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  )
}
