const DIGITOS_DE_VENTANILLA = 6

// ID legible de la Postulación para la ventanilla (el `id` interno es un UUID).
export class NumeroDePostulacion {
  constructor(readonly valor: number) {
    if (!Number.isSafeInteger(valor) || valor <= 0) {
      throw new Error(`Número de postulación inválido: ${valor}. Debe ser un entero mayor a 0.`)
    }
  }

  /** El número con ceros a la izquierda hasta 6 dígitos (ej. `000042`). */
  formatear(): string {
    return String(this.valor).padStart(DIGITOS_DE_VENTANILLA, '0')
  }

  igualA(otro: NumeroDePostulacion): boolean {
    return this.valor === otro.valor
  }
}
