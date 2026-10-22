import type {
  ServicioDeAutenticacion,
  DatosDeRegistro,
  ResultadoDeRegistro,
} from '../../puertos/servicio-de-autenticacion/puerto'

export class RegistrarAspiranteUseCase {
  constructor(private readonly auth: ServicioDeAutenticacion) {}

  async ejecutar(datos: DatosDeRegistro): Promise<ResultadoDeRegistro> {
    // Aquí se pueden agregar reglas de negocio de dominio (ej. edad mínima) antes de delegar en el servicio de auth.
    return this.auth.registrarAspirante(datos)
  }
}
