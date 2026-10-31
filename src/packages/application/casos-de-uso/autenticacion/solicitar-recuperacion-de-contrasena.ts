import type {
  ServicioDeAutenticacion,
  ResultadoDeSolicitudDeRecuperacion,
} from '../../puertos/servicio-de-autenticacion/puerto'

/**
 * Pide el email con el enlace para elegir una contraseña nueva.
 *
 * No revela si el email existe: el caso de uso no valida la cuenta (el
 * adaptador tampoco la distingue) y el borde responde lo mismo en los dos
 * casos. `NO_ENVIADO` describe una falla real de envío, no "no existe".
 */
export class SolicitarRecuperacionDeContrasenaUseCase {
  constructor(private readonly auth: ServicioDeAutenticacion) {}

  async ejecutar(email: string): Promise<ResultadoDeSolicitudDeRecuperacion> {
    return this.auth.solicitarRecuperacionDeContrasena(email)
  }
}
