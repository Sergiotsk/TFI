import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Public_Sans } from 'next/font/google'
import { ShieldCheck, HelpCircle } from 'lucide-react'
import { HeaderInstitucional } from '@/components/layout/header-institucional'
import { FooterInstitucional } from '@/components/layout/footer-institucional'
import { MarcoAuth } from '@/components/auth/marco'
import { FormularioLogin } from '@/components/auth/formulario-login'
import { haySesion } from '@/lib/supabase/sesion'
import { destinoSeguro } from '@/lib/redireccion'
import { cn } from '@/lib/utils'
import '@/temas/frh.css'

const publicSans = Public_Sans({ subsets: ['latin'], variable: '--font-public-sans' })

export const metadata = {
  title: 'Iniciar sesión | UTN Haedo',
  description:
    'Ingresá al Sistema de Gestión de Ingresantes Universitarios (GIU).',
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
    // Contenedor 1: Activa el contexto de la institución
    <div data-institucion="FRH">
      {/* Contenedor 2 (hijo): Activa la trama de 4 capas, colores y fuentes del aspirante */}
      <div
        data-panel="aspirante"
        className={cn(publicSans.variable, 'min-h-screen flex flex-col justify-between font-sans text-foreground')}
      >
        <HeaderInstitucional />

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Columna Izquierda: Identidad Institucional */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                  GIU - Sistema de Gestión de Ingresantes Universitarios
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Gestioná tu documentación, aranceles y seguimiento de expediente en tiempo real.
                </p>
              </div>

              {/* Ficha rápida de garantías del sistema */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 bg-card shadow-(--sombra-tarjeta) flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-foreground block">Trámite Oficial</span>
                    <span className="text-muted-foreground">Validación directa con Bedelía FRH</span>
                  </div>
                </div>

                <div className="p-3.5 bg-card shadow-(--sombra-tarjeta) flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-foreground block">Mesa de Ayuda</span>
                    <span className="text-muted-foreground">alumnos.tup@frh.utn.edu.ar</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Tarjeta de Acceso */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end">
              <div className="w-full max-w-md bg-card shadow-(--sombra-tarjeta) p-8">
                <MarcoAuth subtitulo="Ingresá con tu email y contraseña para acceder a tu legajo.">
                  <FormularioLogin destino={destino} />
                  <div className="mt-6 pt-4 border-t border-border text-center text-xs text-muted-foreground">
                    ¿Todavía no iniciaste tu postulación?{' '}
                    <Link
                      href="/aspirante/inscripcion"
                      className="font-bold text-primary hover:underline ml-1"
                    >
                      Registrate acá
                    </Link>
                  </div>
                </MarcoAuth>
              </div>
            </div>

          </div>
        </main>

        <FooterInstitucional />
      </div>
    </div>
  )
}