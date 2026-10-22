import type { EstadoPostulacion, Postulacion } from '@tfi/domain'

export interface RepositorioDePostulaciones {
  obtenerTodos(): Promise<Postulacion[]>
  obtenerPorId(id: string): Promise<Postulacion | null>
  obtenerPorEstado(estado: EstadoPostulacion): Promise<Postulacion[] | null>
  obtenerPorNumero(numero: number): Promise<Postulacion | null>
}
