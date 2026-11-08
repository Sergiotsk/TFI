import type { GeneradorDeContrasenas } from './puerto'

/** Generador previsible para tests: `Temporal-1-Aa1!`, `Temporal-2-Aa1!`, ... */
export class GeneradorDeContrasenasFake implements GeneradorDeContrasenas {
  private contador = 0

  temporal(): string {
    this.contador += 1
    return `Temporal-${this.contador}-Aa1!`
  }
}
