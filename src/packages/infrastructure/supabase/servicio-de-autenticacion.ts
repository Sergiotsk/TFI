import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ServicioDeAutenticacion,
  DatosDeRegistro,
  ResultadoDeRegistro,
  ResultadoDeInicioDeSesion,
  ConfirmacionDeEnlace,
  ResultadoDeConfirmacionDeEnlace,
  ResultadoDeSolicitudDeRecuperacion,
  ResultadoDeCambioDeContrasena,
} from '@tfi/application'

/** Ruta de la app que canjea los enlaces de los emails. */
const RUTA_DE_CONFIRMACION = 'auth/confirmar'

/** A dónde vuelve cada email después de confirmarse. */
type DestinoDeEnlace = 'panel' | 'recuperar'

export class ServicioDeAutenticacionSupabase implements ServicioDeAutenticacion {
  /**
   * @param urlDeLaApp URL pública de la app para los `redirectTo` de los
   * emails (confirmación de cuenta y recuperación de contraseña). Si queda
   * vacía, Supabase usa el Site URL configurado en el proyecto.
   */
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly urlDeLaApp: string = '',
  ) {}

  async registrarAspirante(datos: DatosDeRegistro): Promise<ResultadoDeRegistro> {
    const redirectTo = this.urlDeConfirmacion('panel')

    const { data, error } = await this.supabase.auth.signUp({
      email: datos.email,
      password: datos.contrasena,
      options: {
        ...(redirectTo ? { emailRedirectTo: redirectTo } : {}),
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

    // Si hay sesión, el email ya está confirmado o la confirmación está
    // desactivada; si no, Supabase mandó el email de confirmación.
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

  async solicitarRecuperacionDeContrasena(
    email: string,
  ): Promise<ResultadoDeSolicitudDeRecuperacion> {
    const redirectTo = this.urlDeConfirmacion('recuperar')

    // Supabase responde OK aunque la cuenta no exista, así que un error acá es
    // una falla real de envío (SMTP o límite de la API), no un email inválido.
    const { error } = await this.supabase.auth.resetPasswordForEmail(
      email,
      redirectTo ? { redirectTo } : {},
    )

    return error ? { resultado: 'NO_ENVIADO' } : { resultado: 'ENVIADO' }
  }

  async cambiarContrasena(contrasena: string): Promise<ResultadoDeCambioDeContrasena> {
    const {
      data: { user },
      error: errorDeSesion,
    } = await this.supabase.auth.getUser()

    if (errorDeSesion || !user) {
      return { resultado: 'SIN_SESION' }
    }

    const { error } = await this.supabase.auth.updateUser({ password: contrasena })

    if (error) {
      return { resultado: 'RECHAZADA' }
    }

    // Cerrar las demás sesiones evita que un token viejo siga vivo después de
    // un cambio de contraseña. Si falla, el cambio ya se hizo igual.
    try {
      await this.supabase.auth.signOut({ scope: 'others' })
    } catch {
      // No es un error para quien cambió la contraseña.
    }

    return { resultado: 'CAMBIADA' }
  }

  async confirmarEnlaceDeEmail(
    confirmacion: ConfirmacionDeEnlace,
  ): Promise<ResultadoDeConfirmacionDeEnlace> {
    // El canje puede tirar (por ejemplo, si falta el verificador PKCE en la
    // cookie o si el enlace se abrió en otro navegador) además de devolver
    // `error`: para el borde las dos cosas son un enlace inválido.
    try {
      if (confirmacion.tipo === 'CODIGO') {
        const { error } = await this.supabase.auth.exchangeCodeForSession(confirmacion.codigo)
        return error ? { resultado: 'INVALIDO' } : { resultado: 'CONFIRMADO' }
      }

      const { error } = await this.supabase.auth.verifyOtp({
        type: confirmacion.tipoDeEnlace,
        token_hash: confirmacion.tokenHash,
      })

      return error ? { resultado: 'INVALIDO' } : { resultado: 'CONFIRMADO' }
    } catch {
      return { resultado: 'INVALIDO' }
    }
  }

  /**
   * URL de la ruta que canjea el enlace. El destino va en la query porque el
   * email solo puede llevar una URL de retorno, y así el borde sabe si después
   * tiene que pedir una contraseña nueva o mandar al panel.
   */
  private urlDeConfirmacion(destino: DestinoDeEnlace): string | undefined {
    if (this.urlDeLaApp === '') {
      return undefined
    }

    const base = this.urlDeLaApp.replace(/\/+$/, '')
    return `${base}/${RUTA_DE_CONFIRMACION}?destino=${destino}`
  }
}
