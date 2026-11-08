import { randomInt } from 'node:crypto'
import type { GeneradorDeContrasenas } from '@tfi/application'

const MAYUSCULAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const MINUSCULAS = 'abcdefghijkmnopqrstuvwxyz'
const DIGITOS = '23456789'
const SIMBOLOS = '!@#$%&*'
const TODOS = MAYUSCULAS + MINUSCULAS + DIGITOS + SIMBOLOS

function elegir(caracteres: string): string {
  return caracteres[randomInt(0, caracteres.length)] ?? caracteres[0]!
}

function mezclar(caracteres: readonly string[]): string[] {
  const resultado = [...caracteres]

  for (let i = resultado.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i + 1)
    const actual = resultado[i]!
    resultado[i] = resultado[j]!
    resultado[j] = actual
  }

  return resultado
}

/**
 * Generador de contraseñas temporales con `crypto.randomInt`.
 *
 * Garantiza al menos una mayúscula, una minúscula, un dígito y un símbolo, y
 * mezcla el resultado para que el orden no sea predecible. La longitud mínima
 * es 12 aunque se configure menos.
 */
export class GeneradorDeContrasenasCrypto implements GeneradorDeContrasenas {
  private readonly longitud: number

  constructor(longitud = 14) {
    this.longitud = Math.max(12, longitud)
  }

  temporal(): string {
    const obligatorios = [
      elegir(MAYUSCULAS),
      elegir(MINUSCULAS),
      elegir(DIGITOS),
      elegir(SIMBOLOS),
    ]
    const resto = Array.from({ length: this.longitud - obligatorios.length }, () =>
      elegir(TODOS),
    )

    return mezclar([...obligatorios, ...resto]).join('')
  }
}
