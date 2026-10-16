import type { User } from '@tfi/domain'

export interface RepositorioDeUsuarios {
  obtenerTodos(): Promise<User[]>
  obtenerPorId(id: string): Promise<User | null>
  obtenerPorRol(
    role: 'INTERESADO' | 'SECRETARIO' | 'DIRECTOR' | 'ADMIN',
  ): Promise<User[] | null>
  guardar(user: User): Promise<void>
}
