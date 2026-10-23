import type { ReactNode } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { INSTITUCION } from '@/config/institucion'
import '@/temas/frh.css'

// Lo común a todos los paneles: el tema de la institución. El grupo (paneles) no aparece en la URL.
// La estructura va un nivel más abajo: el aspirante tiene un recorrido lineal (aspirante/layout.tsx) y el personal
// trabaja con barra lateral ((personal)/layout.tsx).
// El tema se acota con data-institucion: el CSS de Next es global, así que el grupo de rutas solo separa el layout,
// no los estilos.
export default function LayoutDePaneles({ children }: { children: ReactNode }) {
  return (
    <div data-institucion={INSTITUCION.codigo} className="min-h-screen bg-background text-foreground">
      <TooltipProvider>{children}</TooltipProvider>
    </div>
  )
}
