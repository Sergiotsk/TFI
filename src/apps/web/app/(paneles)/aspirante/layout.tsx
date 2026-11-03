import type { ReactNode } from 'react'
import { Public_Sans } from 'next/font/google'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BotonCerrarSesion } from '@/components/auth/boton-cerrar-sesion'
import { crearDependencias } from '@/composition-root'
import { INSTITUCION } from '@/config/institucion'
import { PANEL_DE_ROL } from '@/config/paneles'
import { crearCliente } from '@/lib/supabase/servidor'
import { cn } from '@/lib/utils'

// La tipografía de FRH para el aspirante. Solo define la variable: temas/frh.css la elige como --font-sans.
const publicSans = Public_Sans({ subsets: ['latin'], variable: '--font-public-sans' })

// Panel del aspirante: su trámite es un recorrido lineal (inscripción, pago, documentación, estado), así que no
// lleva barra lateral. Encabezado provisorio: el definitivo, con los pasos, se arma con el encabezado y el stepper
// de la inscripción (feature/formulario-inscripcion) cuando esa rama esté en develop, para no tener dos.
export default async function LayoutDelAspirante({ children }: { children: ReactNode }) {
  const supabase = await crearCliente()
  const { consultarPerfilPropio } = crearDependencias(supabase)
  const perfil = await consultarPerfilPropio.ejecutar()

  // /panel resuelve los dos casos: sin sesión manda al login, y sin perfil muestra el aviso.
  if (!perfil) {
    redirect('/panel')
  }
  // Ubica a cada uno en su panel; no autoriza nada (cada caso de uso exige su rol).
  if (perfil.rol !== 'ASPIRANTE') {
    redirect(PANEL_DE_ROL[perfil.rol as keyof typeof PANEL_DE_ROL])
  }

  return (
    // data-panel le da al aspirante el sistema de diseño de temas/frh.css. El fondo y la fuente se repiten acá porque
    // el div de (paneles)/layout.tsx los resuelve con los valores de afuera.
    <div
      data-panel="aspirante"
      className={cn(publicSans.variable, 'min-h-screen bg-background font-sans text-foreground')}
    >
      <div className="border-b border-border bg-white">
        <div className="mx-auto flex h-(--alto-barra-superior,3.25rem) max-w-3xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <span className="block text-sm font-bold text-primary">{INSTITUCION.nombre}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {perfil.nombre} {perfil.apellido}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/recuperar-contrasena/nueva"
              className="text-sm font-medium text-primary underline underline-offset-4 hover:no-underline"
            >
              Cambiar contraseña
            </Link>
            <BotonCerrarSesion />
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
