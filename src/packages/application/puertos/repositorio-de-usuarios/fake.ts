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
      '20-10000001-3',
      new Date('1990-05-15'),
      'M',
      '1122334455',
      'Calle Falsa 123',
      'INTERESADO',
      new Date(),
      true,
    ),
    new User(
      '2',
      'Ana',
      'Demo',
      'ana.demo@example.com',
      '1232123456',
      '10000002',
      '27-10000002-4',
      new Date('1988-11-20'),
      'F',
      '1112355667788',
      'Av. Siempre Viva 456',
      'SECRETARIO',
      new Date(),
      true,
    ),
    new User(
      '3',
      'Carlos',
      'Demo',
      'carlos.demo@example.com',
      '123123123',
      '10000003',
      '20-10000003-5',
      new Date('1975-03-10'),
      'M',
      '1122331234455',
      'Calle Falsa 123',
      'DIRECTOR',
      new Date(),
      true,
    ),
    new User(
      '4',
      'Laura',
      'Demo',
      'laura.demo@example.com',
      '01293123',
      '10000004',
      '27-10000004-6',
      new Date('1995-08-25'),
      'F',
      '1155667788',
      'Moreno 123',
      'ADMIN',
      new Date(),
      false,
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
