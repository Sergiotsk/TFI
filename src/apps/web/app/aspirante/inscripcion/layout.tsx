import type { ReactNode } from 'react'
import { Public_Sans } from 'next/font/google'
import { INSTITUCION } from '@/config/institucion'
import { cn } from '@/lib/utils'
import '@/temas/frh.css'

// La tipografía de FRH para el aspirante. Solo define la variable: temas/frh.css la elige como --font-sans.
const publicSans = Public_Sans({ subsets: ['latin'], variable: '--font-public-sans' })

// La inscripción es pública (el aspirante todavía no tiene cuenta), así que no puede ir bajo (paneles)/aspirante,
// que exige sesión. Toma igual el sistema de diseño del aspirante: el tema se acota con atributos, no con la carpeta.
export default function LayoutDeLaInscripcion({ children }: { children: ReactNode }) {
  return (
    // Dos niveles, como en los paneles: los selectores de temas/frh.css buscan el panel dentro de la institución.
    <div data-institucion={INSTITUCION.codigo}>
      <div
        data-panel="aspirante"
        className={cn(publicSans.variable, 'min-h-screen bg-background font-sans text-foreground')}
      >
        {children}
      </div>
    </div>
  )
}
