import type { Metadata } from 'next'
import Link from 'next/link'
import { MarcoAuth } from '@/components/auth/marco'
import { FormularioRecuperacion } from '@/components/auth/formulario-recuperacion'

export const metadata: Metadata = {
  title: 'Recuperar contraseña',
  description:
    'Pedí un enlace por email para elegir una contraseña nueva del sistema de inscripción de la UTN FRH.',
}

export default async function PaginaRecuperacion({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const enlaceVencido = params.error === 'enlace'

  return (
    <MarcoAuth subtitulo="Te enviamos un enlace para elegir una contraseña nueva.">
      {enlaceVencido ? (
        <p
          role="alert"
          className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          El enlace venció o ya se usó. Pedí uno nuevo.
        </p>
      ) : null}

      <FormularioRecuperacion />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="font-medium text-primary underline underline-offset-4 hover:no-underline"
        >
          Volver al inicio de sesión
        </Link>
      </p>
    </MarcoAuth>
  )
}
