import type { Reloj } from '@tfi/application'

/** El reloj de verdad: la hora del sistema. */
export class RelojDeSistema implements Reloj {
  ahora(): Date {
    return new Date()
  }
}
