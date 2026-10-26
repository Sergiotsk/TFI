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

export type IconoDeMenu =
  | 'periodos'
  | 'informes'
  | 'no-imputados'
  | 'devoluciones'
  | 'casos'
  | 'postulaciones'
  | 'documentacion'

export interface ItemDeMenu {
  href: string
  etiqueta: string
  icono: IconoDeMenu
  /** Bandeja de pagos cuyo total de pendientes se muestra al lado del ítem. */
  contador?: 'A_DECIDIR' | 'NO_IMPUTADO' | 'DEVUELTO'
}

const PERIODOS: ItemDeMenu = { href: '/personal/periodos', etiqueta: 'Períodos', icono: 'periodos' }
// Los pagos se parten por tarea de Tesorería: importar el informe del día, resolver los pagos que no se pudieron
// imputar y devolver los que rechazó Dirección.
const INFORMES: ItemDeMenu = { href: '/personal/pagos', etiqueta: 'Informes de pagos', icono: 'informes' }
const NO_IMPUTADOS: ItemDeMenu = {
  href: '/personal/pagos/no-imputados',
  etiqueta: 'No imputados',
  icono: 'no-imputados',
  contador: 'NO_IMPUTADO',
}
const DEVOLUCIONES: ItemDeMenu = {
  href: '/personal/pagos/devoluciones',
  etiqueta: 'Devoluciones',
  icono: 'devoluciones',
  contador: 'DEVUELTO',
}
const POSTULACIONES: ItemDeMenu = {
  href: '/personal/postulaciones',
  etiqueta: 'Postulaciones',
  icono: 'postulaciones',
}
const DOCUMENTACION: ItemDeMenu = {
  href: '/personal/documentacion',
  etiqueta: 'Documentación',
  icono: 'documentacion',
}
const CASOS: ItemDeMenu = {
  href: '/direccion/casos',
  etiqueta: 'Casos a decidir',
  icono: 'casos',
  contador: 'A_DECIDIR',
}

// La barra lateral es del personal: trabaja en varias áreas y va y viene entre ellas. El aspirante no tiene menú,
// porque su panel es un recorrido lineal (inscripción, pago, documentación, estado).
// El primer ítem es el panel de cada rol. Ocultar un ítem tampoco autoriza nada: solo evita mostrar pantallas cuyo
// caso de uso le va a responder NoAutorizado.
export const MENU_DE_ROL: Record<RolDelPersonal, readonly ItemDeMenu[]> = {
  TESORERIA: [INFORMES, NO_IMPUTADOS, DEVOLUCIONES, POSTULACIONES],
  SECRETARIA: [PERIODOS, POSTULACIONES, DOCUMENTACION, INFORMES, NO_IMPUTADOS, DEVOLUCIONES],
  DIRECCION: [CASOS, PERIODOS, POSTULACIONES, DOCUMENTACION],
}
