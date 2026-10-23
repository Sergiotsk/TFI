import type { Rol } from '@tfi/domain'

// El panel de cada rol (rutas de specs/001-postulacion-plazo-cupos/tasks.md). `/panel` redirige acá después del
// login. Entrar a un panel no autoriza nada: el rol lo verifica cada caso de uso (Principio VII).
export const PANEL_DE_ROL: Record<Rol, string> = {
  ASPIRANTE: '/aspirante/postulacion',
  TESORERIA: '/personal/pagos',
  SECRETARIA: '/personal/periodos',
  DIRECCION: '/direccion/casos',
}

export type RolDelPersonal = Exclude<Rol, 'ASPIRANTE'>

export function esDelPersonal(rol: Rol): rol is RolDelPersonal {
  return rol !== 'ASPIRANTE'
}

export type IconoDeMenu = 'periodos' | 'pagos' | 'casos' | 'postulaciones'

export interface ItemDeMenu {
  href: string
  etiqueta: string
  icono: IconoDeMenu
}

const PERIODOS: ItemDeMenu = { href: '/personal/periodos', etiqueta: 'Períodos', icono: 'periodos' }
const PAGOS: ItemDeMenu = { href: '/personal/pagos', etiqueta: 'Pagos', icono: 'pagos' }
const POSTULACIONES: ItemDeMenu = {
  href: '/personal/postulaciones',
  etiqueta: 'Postulaciones',
  icono: 'postulaciones',
}
const CASOS: ItemDeMenu = { href: '/direccion/casos', etiqueta: 'Casos a decidir', icono: 'casos' }

// La barra lateral es del personal: trabaja en varias áreas y va y viene entre ellas. El aspirante no tiene menú,
// porque su panel es un recorrido lineal (inscripción, pago, documentación, estado).
// El primer ítem es el panel de cada rol. Ocultar un ítem tampoco autoriza nada: solo evita mostrar pantallas cuyo
// caso de uso le va a responder NoAutorizado.
export const MENU_DE_ROL: Record<RolDelPersonal, readonly ItemDeMenu[]> = {
  TESORERIA: [PAGOS, POSTULACIONES],
  SECRETARIA: [PERIODOS, POSTULACIONES, PAGOS],
  DIRECCION: [CASOS, PERIODOS, POSTULACIONES],
}
