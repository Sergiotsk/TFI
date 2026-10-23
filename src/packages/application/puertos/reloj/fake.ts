import type { Reloj } from './puerto'

/** Reloj de prueba: arranca en un instante fijo y solo se mueve si se le pide. */
export class RelojFijo implements Reloj {
  private instante: Date

  constructor(instante: Date = new Date('2026-01-01T00:00:00.000Z')) {
    this.instante = new Date(instante)
  }

  ahora(): Date {
    return new Date(this.instante)
  }

  avanzar(milisegundos: number): void {
    this.instante = new Date(this.instante.getTime() + milisegundos)
  }
}
