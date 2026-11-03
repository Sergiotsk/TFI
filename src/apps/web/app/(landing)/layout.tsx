import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Bricolage_Grotesque, Inter } from 'next/font/google'
import { cn } from '@/lib/utils'
import { PROYECTO_NOMBRE, SISTEMA_URL } from '@/lib/landing/datos'
import { Encabezado } from '@/components/landing/encabezado'
import { Pie } from '@/components/landing/pie'
import { ScrollSuave } from '@/components/landing/scroll-suave'
import './landing.css'

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  axes: ['opsz'],
  variable: '--font-landing-display',
})

const cuerpo = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-landing-body',
})

export const metadata: Metadata = {
  title: {
    default: `${PROYECTO_NOMBRE} | Presentación del proyecto`,
    template: `${PROYECTO_NOMBRE} | %s`,
  },
  description:
    'Sistema web para inscribirse a la Tecnicatura Universitaria en Programación de la UTN Facultad Regional Haedo: el pago confirma la vacante y la documentación se revisa después.',
}

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className={cn('landing', display.variable, cuerpo.variable)}>
      <ScrollSuave />
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <Encabezado sistemaUrl={SISTEMA_URL} />
      <main id="contenido">{children}</main>
      <Pie />
      {/* Botón fijo para celulares: el acceso al sistema siempre está a mano */}
      <a className="cta-movil" href={SISTEMA_URL}>
        Ir al sistema de inscripción
      </a>
    </div>
  )
}
