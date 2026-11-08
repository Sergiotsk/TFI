import type { Postulacion } from '@tfi/domain'
import type { RepositorioDePerfiles } from '../puertos/repositorio-de-perfiles/puerto'
import { aPostulacionConsultada } from './postulacion-consultada'
import type { PostulacionConsultada } from './postulacion-consultada'

/** Lo mínimo para que el personal sepa de quién es una Postulación. */
export interface DatosDelAspirante {
  nombre: string
  apellido: string
  dni: string
}

/**
 * Lo que ve el personal de una Postulación: lo mismo que el aspirante, más
 * quién la hizo. `aspirante` queda en null si RLS no deja ver su perfil.
 */
export interface PostulacionDelPersonal extends PostulacionConsultada {
  aspirante: DatosDelAspirante | null
}

/**
 * Arma la vista del personal de una página de Postulaciones. Lee los perfiles
 * de toda la página en una sola consulta, no uno por fila.
 */
export async function aPostulacionesDelPersonal(
  postulaciones: readonly Postulacion[],
  perfiles: RepositorioDePerfiles,
  ahora: Date,
): Promise<PostulacionDelPersonal[]> {
  if (postulaciones.length === 0) return []

  const ids = [...new Set(postulaciones.map((postulacion) => postulacion.aspiranteId))]
  const datos = new Map<string, DatosDelAspirante>(
    (await perfiles.obtenerVarios(ids)).map(({ id, nombre, apellido, dni }) => [
      id,
      { nombre, apellido, dni },
    ]),
  )

  return postulaciones.map((postulacion) => ({
    ...aPostulacionConsultada(postulacion, ahora),
    aspirante: datos.get(postulacion.aspiranteId) ?? null,
  }))
}
