import type { SupabaseClient } from '@supabase/supabase-js'
import { Perfil } from '@tfi/domain'
import type { Rol } from '@tfi/domain'
import { DatosDuplicados } from '@tfi/application'
import { armarPagina, rangoDe } from '@tfi/application'
import type {
  FiltrosDePerfil,
  Pagina,
  Paginacion,
  RepositorioDePerfiles,
} from '@tfi/application'

interface FilaPerfil {
  id: string
  email: string
  nombre: string
  apellido: string
  dni: string
  cuil: string
  fecha_nacimiento: string
  sexo: 'M' | 'F' | 'O'
  telefono: string | null
  direccion: string | null
  rol: Rol
  institucion_id: string
  verificado: boolean
  creado_el: string
  actualizado_el: string
}

function mapearPerfil(fila: FilaPerfil): Perfil {
  return new Perfil(
    fila.id,
    fila.email,
    fila.nombre,
    fila.apellido,
    fila.dni,
    fila.cuil,
    new Date(fila.fecha_nacimiento),
    fila.sexo,
    fila.telefono,
    fila.direccion,
    fila.rol,
    fila.institucion_id,
    fila.verificado,
    new Date(fila.creado_el),
    new Date(fila.actualizado_el),
  )
}

export class RepositorioDePerfilesSupabase implements RepositorioDePerfiles {
  constructor(private readonly supabase: SupabaseClient) {}

  async listar(
    filtros: FiltrosDePerfil,
    paginacion: Paginacion,
  ): Promise<Pagina<Perfil>> {
    let consulta = this.supabase.from('perfiles').select('*', { count: 'exact' })

    if (filtros.rol !== undefined) consulta = consulta.eq('rol', filtros.rol)
    if (filtros.dni !== undefined) consulta = consulta.eq('dni', filtros.dni)

    const { desde, hasta } = rangoDe(paginacion)
    const { data, error, count } = await consulta
      .order('apellido', { ascending: true })
      .order('nombre', { ascending: true })
      .range(desde, hasta)

    if (error || !data) return armarPagina([], 0, paginacion)

    return armarPagina((data as FilaPerfil[]).map(mapearPerfil), count ?? 0, paginacion)
  }

  async obtenerPorId(id: string): Promise<Perfil | null> {
    const { data, error } = await this.supabase.from('perfiles').select('*').eq('id', id).maybeSingle()
    if (error || !data) return null
    return mapearPerfil(data as FilaPerfil)
  }

  async buscarPorDni(dni: string): Promise<Perfil | null> {
    const { data, error } = await this.supabase
      .from('perfiles')
      .select('*')
      .eq('dni', dni)
      .maybeSingle()
    if (error || !data) return null
    return mapearPerfil(data as FilaPerfil)
  }

  async guardar(perfil: Perfil): Promise<void> {
    // El alta la hace el trigger crear_perfil_al_registrarse. Acá solo se
    // actualizan los datos personales: RLS y los GRANT por columna impiden
    // tocar rol, email, institución o verificado.
    const { data, error } = await this.supabase
      .from('perfiles')
      .update({
        nombre: perfil.nombre,
        apellido: perfil.apellido,
        dni: perfil.dni,
        cuil: perfil.cuil,
        fecha_nacimiento: perfil.fechaNacimiento.toISOString().slice(0, 10),
        sexo: perfil.sexo,
        telefono: perfil.telefono,
        direccion: perfil.direccion,
      })
      .eq('id', perfil.id)
      .select('id')

    if (error) {
      if (error.code === '23505') throw new DatosDuplicados()
      throw new Error(`No se pudo actualizar el perfil: ${error.message}`)
    }

    if (!data || data.length === 0) {
      throw new Error('No se pudo actualizar el perfil: la escritura no afectó ninguna fila')
    }
  }
}
