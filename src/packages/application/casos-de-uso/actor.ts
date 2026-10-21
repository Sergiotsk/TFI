import type { Rol } from '@tfi/domain'

export class NoAutorizado extends Error {
  constructor(mensaje = 'No autorizado') {
    super(mensaje)
    this.name = 'NoAutorizado'
  }
}

export interface Actor {
  perfilId: string
  rol: Rol
  institucionId: string
}

export function exigirRol(actor: Actor, ...roles: Rol[]): void {
  if (!roles.includes(actor.rol)) {
    throw new NoAutorizado()
  }
}
