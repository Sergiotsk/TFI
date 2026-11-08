import type { GeneradorDeIds } from './puerto'

/** Generador de prueba: ids previsibles para poder afirmarlos en los tests. */
export class GeneradorDeIdsFake implements GeneradorDeIds {
  private siguiente = 1

  constructor(private readonly prefijo = 'id') {}

  nuevo(): string {
    const id = `${this.prefijo}-${this.siguiente}`
    this.siguiente += 1

    return id
  }
}
