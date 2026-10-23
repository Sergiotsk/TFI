import { Perfil } from '@tfi/domain'
import { DatosDuplicados } from '../../casos-de-uso/errores'
import { armarPagina, rangoDe } from '../../paginacion'
import type { Pagina, Paginacion } from '../../paginacion'
import type { FiltrosDePerfil, RepositorioDePerfiles } from './puerto'

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

  async listar(filtros: FiltrosDePerfil, paginacion: Paginacion): Promise<Pagina<Perfil>> {
    const filtrados = this.perfiles
      .filter((perfil) => filtros.rol === undefined || perfil.rol === filtros.rol)
      .filter((perfil) => filtros.dni === undefined || perfil.dni === filtros.dni)
      .sort((a, b) => a.apellido.localeCompare(b.apellido) || a.nombre.localeCompare(b.nombre))

    const { desde, hasta } = rangoDe(paginacion)

    return armarPagina(filtrados.slice(desde, hasta + 1), filtrados.length, paginacion)
  }

  async obtenerPorId(id: string): Promise<Perfil | null> {
    const perfil = this.perfiles.find((u) => u.id === id)
    return perfil ?? null
  }

  async buscarPorDni(dni: string): Promise<Perfil | null> {
    return this.perfiles.find((perfil) => perfil.dni === dni) ?? null
  }

  async guardar(perfil: Perfil): Promise<void> {
    const repetido = this.perfiles.find(
      (otro) => otro.id !== perfil.id && (otro.dni === perfil.dni || otro.cuil === perfil.cuil),
    )
    if (repetido) throw new DatosDuplicados()

    const index = this.perfiles.findIndex((u) => u.id === perfil.id)
    if (index >= 0) {
      this.perfiles[index] = perfil
    } else {
      this.perfiles.push(perfil)
    }
  }

  // Helpers para tests
  reset(): void {
    this.perfiles = []
  }

  agregar(perfil: Perfil): void {
    this.perfiles.push(perfil)
  }
}

