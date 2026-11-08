import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MarcoAuth } from '@/components/auth/marco'
import { FormularioRegistro } from '@/components/auth/formulario-registro'
import { haySesion } from '@/lib/supabase/sesion'

export const metadata = {
  title: 'Registro',
  description:
    'Creá tu cuenta para inscribirte en la Tecnicatura Universitaria en Programación (UTN FRH).',
}

export default async function PaginaRegistro() {
  if (await haySesion()) {
    redirect('/panel')
  }

  return (
    <MarcoAuth subtitulo="Completá tus datos para crear tu cuenta de aspirante.">
      <FormularioRegistro />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Ya tenés cuenta?{' '}
        <Link
          href="/login"
          className="font-medium text-primary underline underline-offset-4 hover:no-underline"
        >
          Iniciá sesión
        </Link>
      </p>
    </MarcoAuth>
  )
}
