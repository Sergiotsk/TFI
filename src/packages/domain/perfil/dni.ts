// Documento del aspirante: solo dígitos. Quitar puntos o espacios es trabajo del borde, no del dominio.
export class Dni {
  constructor(readonly valor: string) {
    if (!/^\d{7,8}$/.test(valor)) {
      throw new Error('DNI inválido: debe tener 7 u 8 dígitos y nada más.')
    }
  }

  igualA(otro: Dni): boolean {
    return this.valor === otro.valor
  }
}
