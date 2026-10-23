const CANTIDAD_DE_DIGITOS = 6

/**
 * El número legible de la Postulación: el que se dice en la ventanilla.
 *
 * La base lo genera con una identidad, así que solo se construye desde un
 * entero positivo. `formatear()` completa con ceros a la izquierda; si el
 * número ya es más largo, se muestra completo.
 */
export class NumeroDePostulacion {
  constructor(readonly valor: number) {
    if (!Number.isSafeInteger(valor) || valor <= 0) {
      throw new Error(`Número de Postulación inválido: ${valor}`)
    }
  }

  static desde(valor: number): NumeroDePostulacion {
    return new NumeroDePostulacion(valor)
  }

  formatear(): string {
    return String(this.valor).padStart(CANTIDAD_DE_DIGITOS, '0')
  }

  equals(otro: NumeroDePostulacion): boolean {
    return this.valor === otro.valor
  }

  /** Alias usado por el dominio de pagos. */
  igualA(otro: NumeroDePostulacion): boolean {
    return this.equals(otro)
  }
}
