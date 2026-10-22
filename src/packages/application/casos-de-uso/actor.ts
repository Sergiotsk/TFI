import type { Rol } from '@tfi/domain'
import { NoAutorizado } from './errores'

export { NoAutorizado }

// El actor es quien opera: el perfil real de la base, con su rol y su
// institución. La identidad sale de getUser() (que valida el JWT contra el
// servidor de Auth), nunca del contenido de una cookie.
export interface Actor {
  perfilId: string
  rol: Rol
  institucionId: string
}

// La autorización por rol se verifica acá, en los casos de uso. RLS es la
// segunda barrera, no la única (Principio VII).
export function exigirRol(actor: Actor, ...roles: Rol[]): void {
  if (!roles.includes(actor.rol)) {
    throw new NoAutorizado()
  }
}
