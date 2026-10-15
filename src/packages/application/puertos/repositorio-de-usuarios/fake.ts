import { User } from '../../../domain/user/user'
import type { RepositorioDeUsuarios } from './puerto'

export class RepositorioDeUsuariosFake implements RepositorioDeUsuarios {
  private users: User[] = [
    new User(
      '1',
      'Juan',
      'Pérez',
      'juan.demo@example.com',
      '123456',
      '10000001',
      new Date(),
      'M',
      '1122334455',
      'Calle Falsa 123',
      'INTERESADO',
    ),
    new User(
      '2',
      'Ana',
      'Demo',
      'ana.demo@example.com',
      '1232123456',
      '10000002',
      new Date(),
      'F',
      '1112355667788',
      'Av. Siempre Viva 456',
      'SECRETARIO',
    ),
    new User(
      '3',
      'Carlos',
      'Demo',
      'carlos.demo@example.com',
      '123123123',
      '10000003',
      new Date(),
      'M',
      '1122331234455',
      'Calle Falsa 123',
      'DIRECTOR',
    ),
    new User(
      '4',
      'Laura',
      'Demo',
      'laura.demo@example.com',
      '01293123',
      '10000004',
      new Date(),
      'M',
      '1155667788',
      'Moreno 123',
      'ADMIN',
    ),
  ]

  async obtenerTodos(): Promise<User[]> {
    return this.users
  }

  async obtenerPorId(id: string): Promise<User | null> {
    const user = this.users.find((u) => u.id === id)
    return user || null
  }

  async guardar(user: User): Promise<void> {
    const index = this.users.findIndex((u) => u.id === user.id)
    if (index >= 0) {
      this.users[index] = user
    } else {
      this.users.push(user)
    }
  }

  async obtenerPorRol(role: string): Promise<User[] | null> {
    return this.users.filter((u) => u.role === role)
  }
}
