import type { ReactNode } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { INSTITUCION } from '@/config/institucion'
import '@/temas/frh.css'

// Layout de los paneles del aspirante y del personal. El grupo (paneles) no aparece en la URL.
// El tema de la institución se acota con data-institucion: el CSS de Next es global, así que el grupo de rutas
// solo separa el layout, no los estilos.
export default function LayoutDePaneles({ children }: { children: ReactNode }) {
  return (
    <div data-institucion={INSTITUCION.codigo} className="min-h-screen bg-background text-foreground">
      <TooltipProvider>{children}</TooltipProvider>
    </div>
  )
}
