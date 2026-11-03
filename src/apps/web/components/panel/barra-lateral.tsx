'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarRange,
  CircleAlert,
  ClipboardList,
  FileCheck,
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
import { iniciales } from '@/components/panel/formato'
import { ETIQUETAS_DE_ROL, INSTITUCION } from '@/config/institucion'
import {
  agruparMenu,
  itemActivoDelMenu,
  type IconoDeMenu,
  type ItemDeMenu,
  type RolDelPersonal,
} from '@/config/paneles'

const ICONOS: Record<IconoDeMenu, LucideIcon> = {
  periodos: CalendarRange,
  informes: FileUp,
  'no-imputados': CircleAlert,
  devoluciones: Undo2,
  casos: Gavel,
  postulaciones: ClipboardList,
  documentacion: FileCheck,
}

export type ContadoresDeMenu = Partial<Record<NonNullable<ItemDeMenu['contador']>, number>>

interface BarraLateralProps {
  rol: RolDelPersonal
  nombre: string
  /** Pendientes de cada bandeja, para el número al lado del ítem. */
  contadores?: ContadoresDeMenu
}

export function BarraLateral({ rol, nombre, contadores = {} }: BarraLateralProps) {
  const activo = itemActivoDelMenu(rol, usePathname())

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-1 py-1.5">
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-[0.7rem] font-bold tracking-wide text-sidebar-primary-foreground group-data-[collapsible=icon]:size-8"
          >
            UTN
          </span>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="block text-sm font-bold text-sidebar-primary">{INSTITUCION.nombre}</span>
            <span className="block text-xs leading-tight text-muted-foreground">{INSTITUCION.carrera}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {agruparMenu(rol).map(({ area, items }) => (
          <SidebarGroup key={area}>
            <SidebarGroupLabel className="font-semibold tracking-wider uppercase">
              {area === 'pagos' ? 'Pagos' : ETIQUETAS_DE_ROL[rol]}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const Icono = ICONOS[item.icono]
                  const pendientes = item.contador ? (contadores[item.contador] ?? 0) : 0
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={item === activo}
                        tooltip={item.etiqueta}
                        className="h-9 rounded-lg data-active:font-semibold"
                      >
                        <Icono />
                        <span>{item.etiqueta}</span>
                      </SidebarMenuButton>
                      {pendientes > 0 ? (
                        <SidebarMenuBadge
                          aria-label={`${pendientes} pendientes`}
                          className="top-2! rounded-full bg-sidebar-primary text-sidebar-primary-foreground peer-hover/menu-button:text-sidebar-primary-foreground peer-data-active/menu-button:text-sidebar-primary-foreground"
                        >
                          {pendientes}
                        </SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Con la barra colapsada se ocultan los textos, no el cierre de sesión: queda el ícono con su tooltip. */}
      <SidebarFooter>
        <div className="flex items-center gap-2.5 rounded-xl border border-sidebar-border bg-background/60 p-2 group-data-[collapsible=icon]:hidden">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
          >
            {iniciales(nombre)}
          </span>
          <div className="min-w-0">
            <span className="block truncate text-sm font-semibold">{nombre}</span>
            <span className="block truncate text-xs text-muted-foreground">{ETIQUETAS_DE_ROL[rol]}</span>
          </div>
        </div>
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
