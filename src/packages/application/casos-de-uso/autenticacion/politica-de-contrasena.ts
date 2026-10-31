/**
 * Política de contraseñas que elige la persona.
 *
 * Vive en aplicación y no en el dominio porque el Perfil no guarda la
 * contraseña: las credenciales son de Supabase Auth. El máximo de 72 es el
 * límite de bcrypt; el mínimo de 8 es la misma regla que pide el registro.
 */
export const LONGITUD_MINIMA_DE_CONTRASENA = 8
export const LONGITUD_MAXIMA_DE_CONTRASENA = 72

/** `true` si la contraseña cumple el largo mínimo y máximo del sistema. */
export function esContrasenaValida(contrasena: string): boolean {
  return (
    contrasena.length >= LONGITUD_MINIMA_DE_CONTRASENA &&
    contrasena.length <= LONGITUD_MAXIMA_DE_CONTRASENA
  )
}
