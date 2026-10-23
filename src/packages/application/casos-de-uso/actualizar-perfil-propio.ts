import { Perfil } from '@tfi/domain'
import type { Sexo } from '@tfi/domain'
import type { RepositorioDePerfiles } from '../puertos/repositorio-de-perfiles/puerto'
import type { Actor } from './actor'
import { NoEncontrado } from './errores'

/**
 * Datos personales que una persona puede corregir de su propio perfil.
 *
 * El DNI, el email, el rol, la institución y la verificación quedan afuera: el
 * DNI identifica a la persona y lo corrige el personal; el email lo maneja
 * Supabase Auth; el resto es autoridad de la facultad.
 */
export interface CambiosDePerfilPropio {
  nombre?: string
  apellido?: string
  cuil?: string
  fechaNacimiento?: Date
  sexo?: Sexo
  telefono?: string | null
  direccion?: string | null
}

/**
 * El propio usuario corrige sus datos personales.
 *
 * No exige rol: cualquier persona autenticada puede editar **su** perfil. El
 * `actor` sale de la sesión, así que nunca se puede apuntar a otro id. El DNI se
 * conserva tal cual; RLS y el grant por columna son la segunda barrera.
 */
export class ActualizarPerfilPropioUseCase {
  constructor(private readonly perfiles: RepositorioDePerfiles) {}

  async ejecutar(actor: Actor, cambios: CambiosDePerfilPropio): Promise<Perfil> {
    const actual = await this.perfiles.obtenerPorId(actor.perfilId)
    if (!actual) throw new NoEncontrado('Perfil no encontrado')

    const actualizado = new Perfil(
      actual.id,
      actual.email,
      cambios.nombre ?? actual.nombre,
      cambios.apellido ?? actual.apellido,
      actual.dni,
      cambios.cuil ?? actual.cuil,
      cambios.fechaNacimiento ?? actual.fechaNacimiento,
      cambios.sexo ?? actual.sexo,
      cambios.telefono !== undefined ? cambios.telefono : actual.telefono,
      cambios.direccion !== undefined ? cambios.direccion : actual.direccion,
      actual.rol,
      actual.institucionId,
      actual.verificado,
      actual.creadoEl,
      actual.actualizadoEl,
    )

    await this.perfiles.guardar(actualizado)

    return actualizado
  }
}
