import { randomUUID } from 'node:crypto'
import type { GeneradorDeIds } from '@tfi/application'

/** El generador de verdad: UUID v4. */
export class GeneradorDeIdsCrypto implements GeneradorDeIds {
  nuevo(): string {
    return randomUUID()
  }
}
