import type { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { BarraLateral } from '@/components/panel/barra-lateral'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { crearDependencias } from '@/composition-root'
import { esDelPersonal, PANEL_DE_ROL } from '@/config/paneles'
import { crearCliente } from '@/lib/supabase/servidor'

// Paneles del personal (Secretaría, Tesorería y Dirección): trabajan en varias áreas, así que van con barra lateral.
// El grupo (personal) no aparece en la URL.
export default async function LayoutDelPersonal({ children }: { children: ReactNode }) {
  const supabase = await crearCliente()
  const { consultarPerfilPropio } = crearDependencias(supabase)
  const perfil = await consultarPerfilPropio.ejecutar()

  // /panel resuelve los dos casos: sin sesión manda al login, y sin perfil muestra el aviso.
  if (!perfil) {
    redirect('/panel')
  }
  // Ubica a cada uno en su panel; no autoriza nada (cada caso de uso exige su rol).
  if (!esDelPersonal(perfil.rol)) {
    redirect(PANEL_DE_ROL[perfil.rol as keyof typeof PANEL_DE_ROL])
  }

  // shadcn guarda en esta cookie si la barra quedó abierta o colapsada.
  const barraAbierta = (await cookies()).get('sidebar_state')?.value !== 'false'

  return (
    <SidebarProvider defaultOpen={barraAbierta}>
      <BarraLateral rol={perfil.rol} nombre={`${perfil.nombre} ${perfil.apellido}`} />
      <SidebarInset>
        <div className="flex h-12 items-center border-b border-border bg-card px-4">
          <SidebarTrigger className="-ml-1" />
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
