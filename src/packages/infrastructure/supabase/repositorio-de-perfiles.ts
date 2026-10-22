import type { SupabaseClient } from '@supabase/supabase-js'
import { Perfil } from '@tfi/domain'
import type { Rol } from '@tfi/domain'
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

  async guardar(): Promise<void> {
    // El alta la hace el trigger crear_perfil_al_registrarse. Las escrituras
    // directas quedan restringidas por RLS y por GRANT (migración 20261021000500).
    throw new Error('guardar() no está permitido desde el adaptador: el perfil lo crea el trigger')
  }
}
