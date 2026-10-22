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
  searchParams: Promise<{ redirect?: string }>
}) {
  if (await haySesion()) {
    redirect('/panel')
  }

  const params = await searchParams
  const destino = destinoSeguro(params.redirect, '/panel')

  return (
    <MarcoAuth subtitulo="Ingresá con tu email y contraseña.">
      <FormularioLogin destino={destino} />
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
