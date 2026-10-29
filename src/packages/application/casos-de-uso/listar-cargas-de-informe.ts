import { ROLES_DEL_PERSONAL, type CargaDeInforme } from '@tfi/domain'
import type { RegistroDeCargas } from '../puertos/registro-de-cargas/puerto'
import type { Actor } from './actor'
import { exigirRol } from './actor'

/** Las cargas del informe de pagos de la institución, de la más reciente a la más vieja. */
export class ListarCargasDeInformeUseCase {
  constructor(private readonly cargas: RegistroDeCargas) {}

  async ejecutar(actor: Actor): Promise<CargaDeInforme[]> {
    exigirRol(actor, ...ROLES_DEL_PERSONAL)

    return this.cargas.listar(actor.institucionId)
  }
}
