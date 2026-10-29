import type { Pago, Rol } from '@tfi/domain'
import type { RegistroDePagos } from '../puertos/registro-de-pagos/puerto'
import type { Actor } from './actor'
import { exigirRol } from './actor'

export type EstadoDeBandeja = 'A_DECIDIR' | 'NO_IMPUTADO' | 'DEVUELTO'

/**
 * Quién ve cada bandeja (contracts/puertos.md): los casos `A_DECIDIR` los
 * resuelve Dirección; los no imputados y los devueltos los gestiona Tesorería,
 * y Secretaría los consulta.
 */
const ROLES_DE_BANDEJA: Record<EstadoDeBandeja, Rol[]> = {
  A_DECIDIR: ['DIRECCION'],
  NO_IMPUTADO: ['TESORERIA', 'SECRETARIA'],
  DEVUELTO: ['TESORERIA', 'SECRETARIA'],
}

/** Lista los pagos de una bandeja de la institución del actor. */
export class ListarBandejaUseCase {
  constructor(private readonly pagos: RegistroDePagos) {}

  async ejecutar(actor: Actor, estado: EstadoDeBandeja): Promise<Pago[]> {
    exigirRol(actor, ...ROLES_DE_BANDEJA[estado])

    return this.pagos.listarPorEstado(actor.institucionId, estado)
  }
}
