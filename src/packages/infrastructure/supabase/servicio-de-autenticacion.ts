import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ServicioDeAutenticacion,
  DatosDeRegistro,
  ResultadoDeRegistro,
  ResultadoDeInicioDeSesion,
} from '@tfi/application'

export class ServicioDeAutenticacionSupabase implements ServicioDeAutenticacion {
  constructor(private readonly supabase: SupabaseClient) {}

  async registrarAspirante(datos: DatosDeRegistro): Promise<ResultadoDeRegistro> {
    const { data, error } = await this.supabase.auth.signUp({
      email: datos.email,
      password: datos.contrasena,
      options: {
        data: {
          nombre: datos.nombre,
          apellido: datos.apellido,
          dni: datos.dni,
          cuil: datos.cuil,
          fecha_nacimiento: datos.fechaDeNacimiento,
          sexo: datos.sexo,
          telefono: datos.telefono,
          direccion: datos.direccion,
        },
      },
    })

    if (error || !data.user) {
      return { resultado: 'RECHAZADO' }
    }

    // Si hay sesión, el email ya está confirmado o la confirmación está desactivada
    // (decisión del equipo: por ahora desactivada).
    return {
      resultado: 'REGISTRADO',
      usuarioId: data.user.id,
      requiereConfirmarEmail: data.session === null,
    }
  }

  async iniciarSesion(email: string, contrasena: string): Promise<ResultadoDeInicioDeSesion> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password: contrasena,
    })

    if (error || !data.user) {
      return { resultado: 'CREDENCIALES_INVALIDAS' }
    }

    return { resultado: 'INICIADA', usuarioId: data.user.id }
  }

  async cerrarSesion(): Promise<void> {
    await this.supabase.auth.signOut()
  }

  async usuarioAutenticado(): Promise<{ id: string } | null> {
    const { data, error } = await this.supabase.auth.getUser()
    if (error || !data.user) {
      return null
    }
    return { id: data.user.id }
  }
}
