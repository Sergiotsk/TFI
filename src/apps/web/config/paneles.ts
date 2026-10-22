import type { Rol } from '@tfi/domain'

// El panel de cada rol (rutas de specs/001-postulacion-plazo-cupos/tasks.md). `/panel` redirige acá después del
// login. Entrar a un panel no autoriza nada: el rol lo verifica cada caso de uso (Principio VII).
export const PANEL_DE_ROL: Record<Rol, string> = {
  ASPIRANTE: '/aspirante/postulacion',
  TESORERIA: '/personal/pagos',
  SECRETARIA: '/personal/periodos',
  DIRECCION: '/direccion/casos',
}
