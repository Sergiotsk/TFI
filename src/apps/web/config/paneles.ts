import type { Rol } from '@tfi/domain'

// El panel de cada rol (rutas de specs/001-postulacion-plazo-cupos/tasks.md). `/panel` redirige acá después del
// login. Entrar a un panel no autoriza nada: el rol lo verifica cada caso de uso (Principio VII).
export const PANEL_DE_ROL: Record<Rol, string> = {
  ASPIRANTE: '/aspirante/postulacion',
  TESORERIA: '/personal/pagos',
  SECRETARIA: '/personal/periodos',
  DIRECCION: '/direccion/casos',
}

export type IconoDeMenu = 'postulacion' | 'periodos' | 'pagos' | 'casos'

export interface ItemDeMenu {
  href: string
  etiqueta: string
  icono: IconoDeMenu
}

const POSTULACION: ItemDeMenu = { href: '/aspirante/postulacion', etiqueta: 'Mi postulación', icono: 'postulacion' }
const PERIODOS: ItemDeMenu = { href: '/personal/periodos', etiqueta: 'Períodos', icono: 'periodos' }
const PAGOS: ItemDeMenu = { href: '/personal/pagos', etiqueta: 'Pagos', icono: 'pagos' }
const CASOS: ItemDeMenu = { href: '/direccion/casos', etiqueta: 'Casos a decidir', icono: 'casos' }

// Lo que muestra la barra lateral de cada rol; el primero es su panel. Ocultar un ítem tampoco autoriza nada:
// solo evita mostrar pantallas cuyo caso de uso le va a responder NoAutorizado.
export const MENU_DE_ROL: Record<Rol, readonly ItemDeMenu[]> = {
  ASPIRANTE: [POSTULACION],
  TESORERIA: [PAGOS],
  SECRETARIA: [PERIODOS, PAGOS],
  DIRECCION: [CASOS, PERIODOS],
}
