import { Procedure } from '@tfi/domain'
import type { RepositorioDeProcedure } from './puerto'

export class RepositorioDeProcedureFake implements RepositorioDeProcedure {
  private procedures: Procedure[] = [
    new Procedure('1', '1', 'INICIADO'),
    new Procedure('2', '1', 'EN PROCESO'),
    new Procedure('3', '2', 'APROBADO'),
    new Procedure('4', '3', 'RECHAZADO'),
    new Procedure('5', '4', 'EN PROCESO'),
  ]

  async obtenerTodos(): Promise<Procedure[]> {
    return this.procedures
  }

  async obtenerPorId(id: string): Promise<Procedure | null> {
    const procedure = this.procedures.find((p) => p.id === id)
    return procedure || null
  }

  async obtenerPorEstado(state: string): Promise<Procedure[]> {
    return this.procedures.filter((p) => p.state === state)
  }

  async obtenerPorUserId(userId: string): Promise<Procedure[]> {
    return this.procedures.filter((p) => p.userId === userId)
  }

  async guardar(procedure: Procedure): Promise<void> {
    const index = this.procedures.findIndex((p) => p.id === procedure.id)
    if (index >= 0) {
      this.procedures[index] = procedure
    } else {
      this.procedures.push(procedure)
    }
  }

  async eliminar(id: string): Promise<void> {
    this.procedures = this.procedures.filter((p) => p.id !== id)
  }
}
