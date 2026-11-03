/**
 * Genera contraseñas temporales para el restablecimiento asistido.
 *
 * Es un puerto porque la aleatoriedad segura depende del entorno: la
 * aplicación no sabe de `crypto` ni de Node. Los tests usan
 * `GeneradorDeContrasenasFake`, que devuelve valores previsibles.
 */
export interface GeneradorDeContrasenas {
  /**
   * Devuelve una contraseña temporal nueva. Debe cumplir la política de
   * contraseñas del sistema y no repetirse entre llamadas.
   */
  temporal(): string
}
