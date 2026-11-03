import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MarcoAuth } from '@/components/auth/marco'
import { FormularioLogin } from '@/components/auth/formulario-login'
import { haySesion } from '@/lib/supabase/sesion'
import { destinoSeguro } from '@/lib/redireccion'

export const metadata = {
  title: 'Iniciar sesión',
  description:
    'Ingresá al sistema de inscripción de la Tecnicatura Universitaria en Programación (UTN FRH).',
}

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>
}) {
  if (await haySesion()) {
    redirect('/panel')
  }

  const params = await searchParams
  const destino = destinoSeguro(params.redirect, '/panel')
  const enlaceVencido = params.error === 'enlace'

  return (
    <MarcoAuth subtitulo="Ingresá con tu email y contraseña.">
      {enlaceVencido ? (
        <p
          role="alert"
          className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          El enlace venció o ya se usó. Probá de nuevo.
        </p>
      ) : null}

      <FormularioLogin destino={destino} />

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link
          href="/recuperar-contrasena"
          className="font-medium text-primary underline underline-offset-4 hover:no-underline"
        >
          Olvidé mi contraseña
        </Link>
      </p>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿No tenés cuenta?{' '}
        <Link
          href="/registro"
          className="font-medium text-primary underline underline-offset-4 hover:no-underline"
        >
          Registrate
        </Link>
      </p>
    </MarcoAuth>
  )
}
