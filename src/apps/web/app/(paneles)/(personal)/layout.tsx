import type { ReactNode } from 'react'
import { Public_Sans } from 'next/font/google'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { BarraLateral, type ContadoresDeMenu } from '@/components/panel/barra-lateral'
import { MigaDelPanel } from '@/components/panel/miga-del-panel'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { crearDependencias } from '@/composition-root'
import { esDelPersonal, PANEL_DE_ROL } from '@/config/paneles'
import { crearCliente } from '@/lib/supabase/servidor'
import { cn } from '@/lib/utils'

// La tipografía de FRH para el personal. Solo define la variable: temas/frh.css la elige como --font-sans.
const publicSans = Public_Sans({ subsets: ['latin'], variable: '--font-public-sans' })

// Paneles del personal (Secretaría, Tesorería y Dirección): trabajan en varias áreas, así que van con barra lateral.
// El grupo (personal) no aparece en la URL.
export default async function LayoutDelPersonal({ children }: { children: ReactNode }) {
  const supabase = await crearCliente()
  const { consultarPerfilPropio, listarBandeja, listarPeriodosAbiertos } = crearDependencias(supabase)
  const perfil = await consultarPerfilPropio.ejecutar()

  // /panel resuelve los dos casos: sin sesión manda al login, y sin perfil muestra el aviso.
  if (!perfil) {
    redirect('/panel')
  }
  // Ubica a cada uno en su panel; no autoriza nada (cada caso de uso exige su rol).
  if (!esDelPersonal(perfil.rol)) {
    redirect(PANEL_DE_ROL[perfil.rol])
  }

  // Pendientes de las bandejas de pagos, para el número al lado de cada ítem: Tesorería y Secretaría ven los no
  // imputados y las devoluciones; Dirección, los casos a decidir.
  let contadores: ContadoresDeMenu = {}
  const actor = { perfilId: perfil.id, rol: perfil.rol, institucionId: perfil.institucionId }
  if (perfil.rol === 'TESORERIA' || perfil.rol === 'SECRETARIA') {
    const [noImputados, devueltos] = await Promise.all([
      listarBandeja.ejecutar(actor, 'NO_IMPUTADO'),
      listarBandeja.ejecutar(actor, 'DEVUELTO'),
    ])
    contadores = { NO_IMPUTADO: noImputados.length, DEVUELTO: devueltos.length }
  } else if (perfil.rol === 'DIRECCION') {
    contadores = { A_DECIDIR: (await listarBandeja.ejecutar(actor, 'A_DECIDIR')).length }
  }

  // El período en curso, para el chip de la barra de arriba: todo el panel trabaja sobre él.
  const [periodoAbierto] = await listarPeriodosAbiertos.ejecutar(actor)

  // shadcn guarda en esta cookie si la barra quedó abierta o colapsada.
  const barraAbierta = (await cookies()).get('sidebar_state')?.value !== 'false'

  return (
    // data-panel acota el sistema de diseño del personal (temas/frh.css): el aspirante no lo hereda. El fondo y la
    // fuente se repiten acá porque el div de (paneles)/layout.tsx los resuelve con los valores de afuera.
    <SidebarProvider
      defaultOpen={barraAbierta}
      data-panel="personal"
      className={cn(publicSans.variable, 'bg-background font-sans text-foreground')}
    >
      <BarraLateral
        rol={perfil.rol}
        nombre={`${perfil.nombre} ${perfil.apellido}`}
        contadores={contadores}
      />
      <SidebarInset>
        <div className="flex h-(--alto-barra-superior,3.25rem) items-center gap-3 border-b border-border bg-white px-4 md:px-6">
          <SidebarTrigger className="-ml-1" />
          <span aria-hidden="true" className="h-4 w-px bg-border" />
          <MigaDelPanel rol={perfil.rol} />
          {periodoAbierto ? (
            <span className="ml-auto shrink-0 truncate rounded-[3px] bg-accent px-2.5 py-1.5 text-[13px] font-semibold text-accent-foreground">
              {periodoAbierto.nombre}
            </span>
          ) : null}
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
