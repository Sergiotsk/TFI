import type { Rol } from './rol'
import type { Sexo } from './sexo'

// El perfil de una persona en la institución. Es lo que el trigger
// crear_perfil_al_registrarse deja en la tabla public.perfiles y lo que
// devuelve el adaptador de lectura (T045b).
//
// No tiene password: las credenciales viven en Supabase Auth, nunca en el
// dominio (Principio VII).
export class Perfil {
  constructor(
    readonly id: string,
    readonly email: string,
    readonly nombre: string,
    readonly apellido: string,
    readonly dni: string,
    readonly cuil: string,
    readonly fechaNacimiento: Date,
    readonly sexo: Sexo,
    readonly telefono: string | null,
    readonly direccion: string | null,
    readonly rol: Rol,
    readonly institucionId: string,
    readonly verificado: boolean,
    readonly creadoEl: Date,
    readonly actualizadoEl: Date,
  ) {}
}
