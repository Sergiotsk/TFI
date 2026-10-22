export interface DatosDeRegistro {
  email: string
  contrasena: string
  nombre: string
  apellido: string
  dni: string
  cuil: string
  fechaDeNacimiento: string // YYYY-MM-DD
  sexo: 'M' | 'F' | 'O'
  telefono?: string
  direccion?: string
}

export type ResultadoDeRegistro =
  | { resultado: 'REGISTRADO'; usuarioId: string; requiereConfirmarEmail: boolean }
  | { resultado: 'RECHAZADO' }

export type ResultadoDeInicioDeSesion =
  | { resultado: 'INICIADA'; usuarioId: string }
  | { resultado: 'CREDENCIALES_INVALIDAS' }

export interface ServicioDeAutenticacion {
  registrarAspirante(datos: DatosDeRegistro): Promise<ResultadoDeRegistro>
  iniciarSesion(email: string, contrasena: string): Promise<ResultadoDeInicioDeSesion>
  cerrarSesion(): Promise<void>
  usuarioAutenticado(): Promise<{ id: string } | null>
}
