import type { ServicioDeAutenticacion } from '../../puertos/servicio-de-autenticacion/puerto'
import { NoAutorizado, SolicitudInvalida } from '../errores'
import {
  LONGITUD_MAXIMA_DE_CONTRASENA,
  LONGITUD_MINIMA_DE_CONTRASENA,
  esContrasenaValida,
} from './politica-de-contrasena'

/**
 * Cambia la contraseña de la cuenta que tiene la sesión abierta.
 *
 * La sesión llega del enlace que se manda por email (o del inicio de sesión
 * normal): el caso de uso nunca recibe un email ni un id de cuenta, así que no
 * se puede usar para cambiar la contraseña de otra persona. La regla de largo
 * se valida acá y también en el borde, para que el formulario muestre el error
 * sin viajar.
 */
export class CambiarContrasenaUseCase {
  constructor(private readonly auth: ServicioDeAutenticacion) {}

  async ejecutar(contrasena: string): Promise<void> {
    if (!esContrasenaValida(contrasena)) {
      throw new SolicitudInvalida(
        `La contraseña debe tener entre ${LONGITUD_MINIMA_DE_CONTRASENA} y ${LONGITUD_MAXIMA_DE_CONTRASENA} caracteres`,
      )
    }

    const resultado = await this.auth.cambiarContrasena(contrasena)

    if (resultado.resultado === 'SIN_SESION') {
      throw new NoAutorizado('El enlace venció o no hay una sesión activa')
    }

    if (resultado.resultado === 'RECHAZADA') {
      throw new SolicitudInvalida('No pudimos cambiar la contraseña: probá con otra')
    }
  }
}
