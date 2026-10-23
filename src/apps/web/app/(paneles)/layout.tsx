import type { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { BarraLateral } from '@/components/panel/barra-lateral'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { crearDependencias } from '@/composition-root'
import { INSTITUCION } from '@/config/institucion'
import { crearCliente } from '@/lib/supabase/servidor'
import '@/temas/frh.css'

// Layout de los paneles del aspirante y del personal. El grupo (paneles) no aparece en la URL.
// El tema de la institución se acota con data-institucion: el CSS de Next es global, así que el grupo de rutas
// solo separa el layout, no los estilos.
export default async function LayoutDePaneles({ children }: { children: ReactNode }) {
  const supabase = await crearCliente()
  const { consultarPerfilPropio } = crearDependencias(supabase)
  const perfil = await consultarPerfilPropio.ejecutar()

  // /panel resuelve los dos casos: sin sesión manda al login, y sin perfil muestra el aviso.
  if (!perfil) {
    redirect('/panel')
  }

  // shadcn guarda en esta cookie si la barra quedó abierta o colapsada.
  const barraAbierta = (await cookies()).get('sidebar_state')?.value !== 'false'

  return (
    <div data-institucion={INSTITUCION.codigo} className="min-h-screen bg-background text-foreground">
      <TooltipProvider>
        <SidebarProvider defaultOpen={barraAbierta}>
          <BarraLateral rol={perfil.rol} nombre={`${perfil.nombre} ${perfil.apellido}`} />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </div>
  )
}
