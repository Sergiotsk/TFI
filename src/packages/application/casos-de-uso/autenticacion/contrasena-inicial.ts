/**
 * Política de la contraseña inicial que entrega el personal.
 *
 * Vive en aplicación y no en el dominio a propósito: el `Perfil` no tiene
 * contraseña (las credenciales viven en Supabase Auth), así que esta regla es
 * una decisión del caso de uso, no un invariante de la entidad.
 */

/** Saca acentos, espacios y mayúsculas para que el nombre sirva en una URL o un teclado. */
function normalizarNombre(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '')
}

/**
 * Contraseña inicial de una cuenta: `nombre` + `dni`.
 *
 * Ejemplo: Ana Pérez con DNI 30.123.456 → `ana30123456`. No se usa el apellido
 * porque dos hermanos con el mismo apellido y DNI distinto ya quedan distintos,
 * y el nombre es más fácil de dictar en la mesa de entrada.
 */
export function contrasenaInicialDe(perfil: { nombre: string; dni: string }): string {
  const dni = perfil.dni.replace(/\D/g, '')
  return `${normalizarNombre(perfil.nombre)}${dni}`
}
