import type {
  ServicioDeAutenticacion,
  DatosDeRegistro,
  ResultadoDeRegistro,
  ResultadoDeInicioDeSesion,
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

  // Helper para tests
  reset(): void {
    this.usuarios.clear()
    this.usuarioActualId = null
  }
}
