import { Perfil } from '@tfi/domain'
import type { Rol } from '@tfi/domain'
import type { RepositorioDePerfiles } from './puerto'

export class RepositorioDePerfilesFake implements RepositorioDePerfiles {
  private perfiles: Perfil[] = [
    new Perfil(
      '1',
      'juan.demo@example.com',
      'Juan',
      'Pérez',
      '10000001',
      '20100000013',
      new Date('1990-05-15'),
      'M',
      '1122334455',
      'Calle Falsa 123',
      'ASPIRANTE',
      '00000000-0000-0000-0000-000000000001',
      true,
      new Date(),
      new Date(),
    ),
    new Perfil(
      '2',
      'ana.demo@example.com',
      'Ana',
      'Demo',
      '10000002',
      '27100000024',
      new Date('1988-11-20'),
      'F',
      '1122334455',
      'Av. Siempre Viva 456',
      'SECRETARIA',
      '00000000-0000-0000-0000-000000000001',
      true,
      new Date(),
      new Date(),
    ),
    new Perfil(
      '3',
      'carlos.demo@example.com',
      'Carlos',
      'Demo',
      '10000003',
      '20100000035',
      new Date('1975-03-10'),
      'M',
      '1122334455',
      'Calle Falsa 123',
      'DIRECCION',
      '00000000-0000-0000-0000-000000000001',
      true,
      new Date(),
      new Date(),
    ),
    new Perfil(
      '4',
      'laura.demo@example.com',
      'Laura',
      'Demo',
      '10000004',
      '27100000046',
      new Date('1995-08-25'),
      'F',
      '1122334455',
      'Moreno 123',
      'TESORERIA',
      '00000000-0000-0000-0000-000000000001',
      true,
      new Date(),
      new Date(),
    ),
  ]

  async obtenerTodos(): Promise<Perfil[]> {
    return this.perfiles
  }

  async obtenerPorId(id: string): Promise<Perfil | null> {
    const perfil = this.perfiles.find((u) => u.id === id)
    return perfil ?? null
  }

  async guardar(perfil: Perfil): Promise<void> {
    const index = this.perfiles.findIndex((u) => u.id === perfil.id)
    if (index >= 0) {
      this.perfiles[index] = perfil
    } else {
      this.perfiles.push(perfil)
    }
  }

  async obtenerPorRol(rol: Rol): Promise<Perfil[] | null> {
    return this.perfiles.filter((u) => u.rol === rol)
  }

  // Helpers para tests
  reset(): void {
    this.perfiles = []
  }

  agregar(perfil: Perfil): void {
    this.perfiles.push(perfil)
  }
}

