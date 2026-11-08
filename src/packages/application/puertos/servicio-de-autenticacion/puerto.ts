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

/**
 * Enlaces que Supabase manda por email y que la aplicación puede canjear por
 * una sesión. `recovery` es el de "elegí una contraseña nueva" e `email`/`signup`
 * los de confirmar la cuenta.
 */
export type TipoDeEnlaceDeEmail = 'recovery' | 'signup' | 'invite' | 'magiclink' | 'email'

/**
 * Cómo llega el enlace a la aplicación.
 *
 * - `CODIGO`: el flujo PKCE de `@supabase/ssr` redirige con `?code=` y la
 *   verificación se canjea contra el verificador guardado en cookies.
 * - `TOKEN`: si la plantilla del email usa `{{ .TokenHash }}`, el enlace trae
 *   `?token_hash=&type=` y se verifica directo.
 */
export type ConfirmacionDeEnlace =
  | { tipo: 'CODIGO'; codigo: string }
  | { tipo: 'TOKEN'; tokenHash: string; tipoDeEnlace: TipoDeEnlaceDeEmail }

export type ResultadoDeConfirmacionDeEnlace =
  | { resultado: 'CONFIRMADO' }
  | { resultado: 'INVALIDO' }

export type ResultadoDeSolicitudDeRecuperacion =
  | { resultado: 'ENVIADO' }
  | { resultado: 'NO_ENVIADO' }

export type ResultadoDeCambioDeContrasena =
  | { resultado: 'CAMBIADA' }
  | { resultado: 'SIN_SESION' }
  | { resultado: 'RECHAZADA' }

export interface ServicioDeAutenticacion {
  registrarAspirante(datos: DatosDeRegistro): Promise<ResultadoDeRegistro>
  iniciarSesion(email: string, contrasena: string): Promise<ResultadoDeInicioDeSesion>
  cerrarSesion(): Promise<void>
  usuarioAutenticado(): Promise<{ id: string } | null>
  /**
   * Manda el email con el enlace para elegir una contraseña nueva.
   *
   * El adaptador no distingue si el email existe: si la cuenta no existe, la
   * respuesta también es `ENVIADO` (así el borde no filtra qué cuentas hay).
   * `NO_ENVIADO` queda para fallas reales (SMTP caído, límite de envíos).
   */
  solicitarRecuperacionDeContrasena(email: string): Promise<ResultadoDeSolicitudDeRecuperacion>
  /**
   * Cambia la contraseña de la cuenta con la sesión abierta. La sesión la crea
   * el enlace del email o el inicio de sesión normal; nunca se recibe un email
   * ni un id de cuenta por parámetro.
   */
  cambiarContrasena(contrasena: string): Promise<ResultadoDeCambioDeContrasena>
  /** Canjea el enlace del email (confirmación de cuenta o recuperación) por una sesión. */
  confirmarEnlaceDeEmail(
    confirmacion: ConfirmacionDeEnlace,
  ): Promise<ResultadoDeConfirmacionDeEnlace>
}
