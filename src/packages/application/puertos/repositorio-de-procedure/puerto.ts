import type { Procedure } from '@tfi/domain'

export interface RepositorioDeProcedure {
  obtenerTodos(): Promise<Procedure[]>
  obtenerPorId(id: string): Promise<Procedure | null>
  obtenerPorEstado(
    state: 'INICIADO' | 'EN PROCESO' | 'APROBADO' | 'RECHAZADO',
  ): Promise<Procedure[] | null>
  guardar(procedure: Procedure): Promise<void>
}
