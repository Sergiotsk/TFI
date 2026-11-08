import type {
  ServicioDeAutenticacion,
  DatosDeRegistro,
  ResultadoDeRegistro,
  ResultadoDeInicioDeSesion,
  ConfirmacionDeEnlace,
  ResultadoDeConfirmacionDeEnlace,
  ResultadoDeSolicitudDeRecuperacion,
  ResultadoDeCambioDeContrasena,
} from './puerto'

interface UsuarioFakeRecord {
  id: string
  email: string
  contrasena: string
  datos: DatosDeRegistro
}

export class ServicioDeAutenticacionFake implements ServicioDeAutenticacion {
  private usuarios = new Map<string, UsuarioFakeRecord>()
  private usuarioActualId: string | null = null

  /**
   * Cuenta a la que apunta el último enlace de recuperación "enviado". En un
   * adaptador real el token viaja en el email; acá alcanza con recordar cuál
   * era para que el canje deje la sesión abierta.
   */
  private usuarioPendienteDeEnlaceId: string | null = null

  /** Los emails para los que se pidió un enlace, en orden. */
  readonly recuperacionesSolicitadas: string[] = []

  /** Simula una falla de envío (SMTP caído o límite de la API). */
  fallarLaRecuperacion = false

  /** Simula que Auth rechaza la contraseña (por ejemplo, por una política más estricta). */
  rechazarElCambioDeContrasena = false

  async registrarAspirante(datos: DatosDeRegistro): Promise<ResultadoDeRegistro> {
    // Verificar duplicados de email en memoria
    for (const u of this.usuarios.values()) {
      if (u.email === datos.email) {
        return { resultado: 'RECHAZADO' }
      }
    }

    const usuarioId = `user-fake-${Date.now()}-${Math.random()}`
    this.usuarios.set(usuarioId, {
      id: usuarioId,
      email: datos.email,
      contrasena: datos.contrasena,
      datos,
    })

    this.usuarioActualId = usuarioId
    return { resultado: 'REGISTRADO', usuarioId, requiereConfirmarEmail: false }
  }

  async iniciarSesion(email: string, contrasena: string): Promise<ResultadoDeInicioDeSesion> {
    for (const u of this.usuarios.values()) {
      if (u.email === email && u.contrasena === contrasena) {
        this.usuarioActualId = u.id
        return { resultado: 'INICIADA', usuarioId: u.id }
      }
    }
    return { resultado: 'CREDENCIALES_INVALIDAS' }
  }

  async cerrarSesion(): Promise<void> {
    this.usuarioActualId = null
  }

  async usuarioAutenticado(): Promise<{ id: string } | null> {
    if (!this.usuarioActualId) return null
    return { id: this.usuarioActualId }
  }

  async solicitarRecuperacionDeContrasena(
    email: string,
  ): Promise<ResultadoDeSolicitudDeRecuperacion> {
    this.recuperacionesSolicitadas.push(email)

    if (this.fallarLaRecuperacion) {
      return { resultado: 'NO_ENVIADO' }
    }

    // Como Supabase: no distingue si el email existe. Si existe, el enlace
    // apunta a esa cuenta; si no, no hay a quién abrirle la sesión después.
    this.usuarioPendienteDeEnlaceId =
      [...this.usuarios.values()].find((u) => u.email === email)?.id ?? null

    return { resultado: 'ENVIADO' }
  }

  async cambiarContrasena(contrasena: string): Promise<ResultadoDeCambioDeContrasena> {
    if (!this.usuarioActualId) {
      return { resultado: 'SIN_SESION' }
    }

    const usuario = this.usuarios.get(this.usuarioActualId)
    if (!usuario) {
      return { resultado: 'SIN_SESION' }
    }

    if (this.rechazarElCambioDeContrasena) {
      return { resultado: 'RECHAZADA' }
    }

    usuario.contrasena = contrasena
    return { resultado: 'CAMBIADA' }
  }

  async confirmarEnlaceDeEmail(
    confirmacion: ConfirmacionDeEnlace,
  ): Promise<ResultadoDeConfirmacionDeEnlace> {
    const token = confirmacion.tipo === 'CODIGO' ? confirmacion.codigo : confirmacion.tokenHash

    if (token === '' || !this.usuarioPendienteDeEnlaceId) {
      return { resultado: 'INVALIDO' }
    }

    this.usuarioActualId = this.usuarioPendienteDeEnlaceId
    this.usuarioPendienteDeEnlaceId = null
    return { resultado: 'CONFIRMADO' }
  }

  // Helper para tests
  reset(): void {
    this.usuarios.clear()
    this.usuarioActualId = null
    this.usuarioPendienteDeEnlaceId = null
    this.recuperacionesSolicitadas.length = 0
    this.fallarLaRecuperacion = false
    this.rechazarElCambioDeContrasena = false
  }
}
