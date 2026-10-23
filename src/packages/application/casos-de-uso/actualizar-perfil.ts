import { Perfil } from '@tfi/domain'
import type { Sexo } from '@tfi/domain'
import { ROLES_DEL_PERSONAL } from '@tfi/domain'
import type { RepositorioDePerfiles } from '../puertos/repositorio-de-perfiles/puerto'
import type { Actor } from './actor'
import { exigirRol } from './actor'
import { NoEncontrado } from './errores'

/** Campos que el personal puede corregir. El rol, el email y la institución no. */
export interface CambiosDePerfil {
  nombre?: string
  apellido?: string
  dni?: string
  cuil?: string
  fechaNacimiento?: Date
  sexo?: Sexo
  telefono?: string | null
  direccion?: string | null
}

/**
 * Acción manual del personal: corrige los datos personales de un perfil.
 *
 * Solo los datos de la persona: `rol`, `email`, `institucionId` y `verificado`
 * se conservan tal como estaban, y el perfil tiene que ser de la institución
 * del actor. La autorización por rol se hace acá; RLS y los GRANT por columna
 * son la segunda barrera.
 */
export class ActualizarPerfilUseCase {
  constructor(private readonly perfiles: RepositorioDePerfiles) {}

  async ejecutar(actor: Actor, perfilId: string, cambios: CambiosDePerfil): Promise<Perfil> {
    exigirRol(actor, ...ROLES_DEL_PERSONAL)

    const perfil = await this.perfiles.obtenerPorId(perfilId)
    if (!perfil || perfil.institucionId !== actor.institucionId) {
      throw new NoEncontrado('Perfil no encontrado')
    }

    const actualizado = new Perfil(
      perfil.id,
      perfil.email,
      cambios.nombre ?? perfil.nombre,
      cambios.apellido ?? perfil.apellido,
      cambios.dni ?? perfil.dni,
      cambios.cuil ?? perfil.cuil,
      cambios.fechaNacimiento ?? perfil.fechaNacimiento,
      cambios.sexo ?? perfil.sexo,
      cambios.telefono !== undefined ? cambios.telefono : perfil.telefono,
      cambios.direccion !== undefined ? cambios.direccion : perfil.direccion,
      perfil.rol,
      perfil.institucionId,
      perfil.verificado,
      perfil.creadoEl,
      perfil.actualizadoEl,
    )

    await this.perfiles.guardar(actualizado)

    return actualizado
  }
}
