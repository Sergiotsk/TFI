import type { ServicioDeAutenticacion } from '../../puertos/servicio-de-autenticacion/puerto'

export class CerrarSesionUseCase {
  constructor(private readonly auth: ServicioDeAutenticacion) {}

  async ejecutar(): Promise<void> {
    return this.auth.cerrarSesion()
  }
}
