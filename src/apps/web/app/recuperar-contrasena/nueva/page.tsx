import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MarcoAuth } from '@/components/auth/marco'
import { FormularioNuevaContrasena } from '@/components/auth/formulario-nueva-contrasena'
import { haySesion } from '@/lib/supabase/sesion'

export const metadata: Metadata = {
  title: 'Elegí una contraseña nueva',
  description: 'Cambiá la contraseña de tu cuenta del sistema de inscripción de la UTN FRH.',
}

export default async function PaginaNuevaContrasena() {
  // La sesión la abre el enlace del email o un inicio de sesión normal: sin
  // sesión no hay cuenta a la que cambiarle la contraseña.
  if (!(await haySesion())) {
    redirect('/recuperar-contrasena?error=enlace')
  }

  return (
    <MarcoAuth subtitulo="Ingresá dos veces la contraseña nueva.">
      <FormularioNuevaContrasena />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link
          href="/panel"
          className="font-medium text-primary underline underline-offset-4 hover:no-underline"
        >
          Volver al panel
        </Link>
      </p>
    </MarcoAuth>
  )
}
