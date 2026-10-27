import type {
  ServicioDeAutenticacion,
  ConfirmacionDeEnlace,
} from '../../puertos/servicio-de-autenticacion/puerto'

/**
 * Canjea el enlace que llega por email (confirmar la cuenta o recuperar la
 * contraseña) por una sesión.
 *
 * Devuelve `false` si el enlace venció, ya se usó o no corresponde a este
 * navegador. El borde decide a dónde mandar a la persona en cada caso.
 */
export class ConfirmarEnlaceDeEmailUseCase {
  constructor(private readonly auth: ServicioDeAutenticacion) {}

  async ejecutar(confirmacion: ConfirmacionDeEnlace): Promise<boolean> {
    const resultado = await this.auth.confirmarEnlaceDeEmail(confirmacion)
    return resultado.resultado === 'CONFIRMADO'
  }
}
