'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarRange, ClipboardList, Gavel, LogOut, Wallet, type LucideIcon } from 'lucide-react'
import { cerrarSesion } from '@/app/panel/actions'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { ETIQUETAS_DE_ROL, INSTITUCION } from '@/config/institucion'
import { MENU_DE_ROL, type IconoDeMenu, type RolDelPersonal } from '@/config/paneles'

const ICONOS: Record<IconoDeMenu, LucideIcon> = {
  periodos: CalendarRange,
  pagos: Wallet,
  casos: Gavel,
  postulaciones: ClipboardList,
}

interface BarraLateralProps {
  rol: RolDelPersonal
  nombre: string
}

export function BarraLateral({ rol, nombre }: BarraLateralProps) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="px-2 py-1.5 group-data-[collapsible=icon]:hidden">
          <span className="block text-sm font-bold text-sidebar-primary">{INSTITUCION.nombre}</span>
          <span className="block text-xs text-muted-foreground">{INSTITUCION.carrera}</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{ETIQUETAS_DE_ROL[rol]}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MENU_DE_ROL[rol].map((item) => {
                const Icono = ICONOS[item.icono]
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={pathname === item.href}
                      tooltip={item.etiqueta}
                    >
                      <Icono />
                      <span>{item.etiqueta}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Con la barra colapsada se ocultan los textos, no el cierre de sesión: queda el ícono con su tooltip. */}
      <SidebarFooter>
        <span className="truncate px-2 text-sm font-medium group-data-[collapsible=icon]:hidden">{nombre}</span>
        <form action={cerrarSesion}>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton type="submit" tooltip="Cerrar sesión">
                <LogOut />
                <span>Cerrar sesión</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </form>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
