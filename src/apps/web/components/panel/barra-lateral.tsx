'use client'

import Image from 'next/image'
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
      <SidebarHeader className="gap-3.5 border-b border-sidebar-border pt-5 pb-5 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:py-2">
        {/* El logo es de tinta oscura: va sobre una placa blanca. Colapsada, la barra no tiene ancho para él. */}
        <div className="bg-white px-3.5 py-4 group-data-[collapsible=icon]:hidden">
          <Image
            src={INSTITUCION.logo.src}
            alt={INSTITUCION.logo.alt}
            width={INSTITUCION.logo.ancho}
            height={INSTITUCION.logo.alto}
            priority
            className="h-auto w-full max-w-[200px]"
          />
        </div>
        <span className="px-2 text-[13px] leading-[18px] text-white/80 group-data-[collapsible=icon]:hidden">
          {INSTITUCION.carrera}
        </span>
        <span
          aria-hidden="true"
          className="hidden size-8 items-center justify-center bg-sidebar-primary text-[0.7rem] font-extrabold text-sidebar-primary-foreground group-data-[collapsible=icon]:flex"
        >
          UTN
        </span>
      </SidebarHeader>

      <SidebarContent className="gap-3 pt-4">
        {agruparMenu(rol).map(({ area, items }) => (
          <SidebarGroup key={area}>
            <SidebarGroupLabel className="text-xs font-extrabold tracking-[0.8px] text-white/70 uppercase">
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
                        className="h-11 text-[15px] data-active:font-semibold data-active:shadow-[inset_3px_0_0_var(--sidebar-primary)] [&_svg]:size-[18px]"
                      >
                        <Icono />
                        <span>{item.etiqueta}</span>
                      </SidebarMenuButton>
                      {pendientes > 0 ? (
                        <SidebarMenuBadge
                          aria-label={`${pendientes} pendientes`}
                          className="top-3! bg-sidebar-primary text-sidebar-primary-foreground peer-hover/menu-button:text-sidebar-primary-foreground peer-data-active/menu-button:text-sidebar-primary-foreground"
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
      <SidebarFooter className="border-t border-sidebar-border pt-4 group-data-[collapsible=icon]:border-0">
        <div className="flex items-center gap-3 px-2 pb-2 group-data-[collapsible=icon]:hidden">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center bg-sidebar-primary text-sm font-extrabold text-sidebar-primary-foreground"
          >
            {iniciales(nombre)}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[15px] font-semibold text-sidebar-accent-foreground">{nombre}</span>
            <span className="truncate text-[13px] text-white/80">{ETIQUETAS_DE_ROL[rol]}</span>
          </span>
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
