import { redirect } from 'next/navigation'
import Link from 'next/link'
import { HeaderInstitucional } from '@/components/layout/header-institucional'
import { FooterInstitucional } from '@/components/layout/footer-institucional'
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
    <div className="bg-[#f0f3ff] text-slate-800 min-h-screen flex flex-col justify-between font-sans">
      <HeaderInstitucional />

      <main className="flex-1 flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-md">
          <MarcoAuth subtitulo="Ingresá con tu email y contraseña.">
            <FormularioLogin destino={destino} />
            <p className="mt-6 text-center text-sm text-muted-foreground">
              ¿No tenés cuenta?{' '}
              <Link
                href="/aspirante/inscripcion"
                className="font-medium text-primary underline underline-offset-4 hover:no-underline"
              >
                Registrate
              </Link>
            </p>
          </MarcoAuth>
        </div>
      </main>

      <FooterInstitucional />
    </div>
  )
}