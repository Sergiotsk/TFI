import type { Perfil, Rol } from '@tfi/domain'

export interface RepositorioDePerfiles {
  obtenerTodos(): Promise<Perfil[]>
  obtenerPorId(id: string): Promise<Perfil | null>
  obtenerPorRol(rol: Rol): Promise<Perfil[] | null>
  guardar(perfil: Perfil): Promise<void>
}
