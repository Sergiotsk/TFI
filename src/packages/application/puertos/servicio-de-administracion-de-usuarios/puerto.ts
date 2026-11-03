/** Resultado de intentar cambiar la contraseña de una cuenta de Auth. */
export type ResultadoDeRestablecimiento =
  | { resultado: 'RESTABLECIDA' }
  | { resultado: 'USUARIO_INEXISTENTE' }

/**
 * Administración de las credenciales que viven en Supabase Auth.
 *
 * A diferencia de `ServicioDeAutenticacion` (que opera con la sesión de quien
 * usa la aplicación), este puerto cambia la contraseña de *otra* cuenta y por
 * eso necesita la service role key. Solo lo usa el restablecimiento asistido
 * por el personal: nunca se expone al navegador.
 */
export interface ServicioDeAdministracionDeUsuarios {
  /**
   * Cambia la contraseña sin pedir la anterior.
   *
   * Devuelve `USUARIO_INEXISTENTE` si la cuenta de Auth ya no existe (por
   * ejemplo, un perfil creado a mano sin registro previo).
   */
  restablecerContrasena(
    usuarioId: string,
    contrasena: string,
  ): Promise<ResultadoDeRestablecimiento>
}
