// Dinero en centavos enteros: no hay `float` en ningún punto del sistema.
export class Monto {
  constructor(readonly centavos: number) {
    if (!Number.isSafeInteger(centavos) || centavos < 0) {
      throw new Error(`Monto inválido: ${centavos}. Debe ser un entero de centavos mayor o igual a 0.`)
    }
  }

  /** `true` si este monto alcanza para pagar `otro` (es mayor o igual). */
  cubre(otro: Monto): boolean {
    return this.centavos >= otro.centavos
  }

  igualA(otro: Monto): boolean {
    return this.centavos === otro.centavos
  }
}
