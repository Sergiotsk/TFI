import type { User } from '../../../domain/user/user'

export interface RepositorioDeUsuarios {
  obtenerTodos(): Promise<User[]>
  obtenerPorId(id: string): Promise<User | null>
  obtenerPorRol(
    role: 'INTERESADO' | 'SECRETARIO' | 'DIRECTOR' | 'ADMIN',
  ): Promise<User[] | null>
  guardar(user: User): Promise<void>
}
