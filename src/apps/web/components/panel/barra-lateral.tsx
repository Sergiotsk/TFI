'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarRange,
  CircleAlert,
  ClipboardList,
  FileUp,
  Gavel,
  KeyRound,
  LogOut,
  Undo2,
  type LucideIcon,
} from 'lucide-react'
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
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { ETIQUETAS_DE_ROL, INSTITUCION } from '@/config/institucion'
import { MENU_DE_ROL, type IconoDeMenu, type ItemDeMenu, type RolDelPersonal } from '@/config/paneles'

const ICONOS: Record<IconoDeMenu, LucideIcon> = {
  periodos: CalendarRange,
  informes: FileUp,
  'no-imputados': CircleAlert,
  devoluciones: Undo2,
  casos: Gavel,
  postulaciones: ClipboardList,
}

export type ContadoresDeMenu = Partial<Record<NonNullable<ItemDeMenu['contador']>, number>>

interface BarraLateralProps {
  rol: RolDelPersonal
  nombre: string
  /** Pendientes de cada bandeja, para el número al lado del ítem. */
  contadores?: ContadoresDeMenu
}

export function BarraLateral({ rol, nombre, contadores = {} }: BarraLateralProps) {
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
                const pendientes = item.contador ? (contadores[item.contador] ?? 0) : 0
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
                    {pendientes > 0 ? (
                      <SidebarMenuBadge aria-label={`${pendientes} pendientes`}>{pendientes}</SidebarMenuBadge>
                    ) : null}
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
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/recuperar-contrasena/nueva" />}
              tooltip="Cambiar contraseña"
            >
              <KeyRound />
              <span>Cambiar contraseña</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
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
