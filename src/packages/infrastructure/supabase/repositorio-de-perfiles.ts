import type { SupabaseClient } from '@supabase/supabase-js'
import { Perfil } from '@tfi/domain'
import type { Rol } from '@tfi/domain'
import { DatosDuplicados } from '@tfi/application'
import type { RepositorioDePerfiles } from '@tfi/application'

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

  async obtenerTodos(): Promise<Perfil[]> {
    const { data, error } = await this.supabase.from('perfiles').select('*')
    if (error || !data) return []
    return (data as FilaPerfil[]).map(mapearPerfil)
  }

  async obtenerPorId(id: string): Promise<Perfil | null> {
    const { data, error } = await this.supabase.from('perfiles').select('*').eq('id', id).maybeSingle()
    if (error || !data) return null
    return mapearPerfil(data as FilaPerfil)
  }

  async obtenerPorRol(rol: Rol): Promise<Perfil[] | null> {
    const { data, error } = await this.supabase.from('perfiles').select('*').eq('rol', rol)
    if (error || !data) return []
    return (data as FilaPerfil[]).map(mapearPerfil)
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
