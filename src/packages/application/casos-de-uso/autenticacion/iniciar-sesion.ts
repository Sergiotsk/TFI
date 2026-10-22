import type {
  ServicioDeAutenticacion,
  ResultadoDeInicioDeSesion,
} from '../../puertos/servicio-de-autenticacion/puerto'

export class IniciarSesionUseCase {
  constructor(private readonly auth: ServicioDeAutenticacion) {}

  async ejecutar(email: string, contrasena: string): Promise<ResultadoDeInicioDeSesion> {
    return this.auth.iniciarSesion(email, contrasena)
  }
}
