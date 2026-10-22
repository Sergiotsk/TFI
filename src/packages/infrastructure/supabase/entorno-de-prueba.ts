/**
 * Acceso a la base de prueba para los contratos de infrastructure.
 *
 * Variables de entorno (las imprime `supabase status` en un proyecto local):
 * - SUPABASE_TEST_URL: URL del proyecto de prueba.
 * - SUPABASE_TEST_PUBLISHABLE_KEY: clave publica (anon) para registrarse e iniciar sesion.
 * - SUPABASE_TEST_SERVICE_ROLE_KEY: clave de servicio, para leer y escribir en la base
 *   directamente (los triggers y las politicas RLS no se ven desde el rol anon).
 *
 * Si faltan, los tests de contrato se saltan solos: la suite de unidad corre siempre.
 */

export function hayEntornoDePrueba(): boolean {
  return Boolean(
    process.env.SUPABASE_TEST_URL && process.env.SUPABASE_TEST_PUBLISHABLE_KEY,
  )
}

/**
 * Los tests que leen public.perfiles directo (los del trigger) necesitan ademas
 * la clave de servicio: el rol anon no tiene SELECT sobre esa tabla.
 */
export function hayEntornoDePruebaConServicio(): boolean {
  return hayEntornoDePrueba() && Boolean(process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)
}

export function urlDePrueba(): string {
  return exigir('SUPABASE_TEST_URL')
}

export function clavePublicaDePrueba(): string {
  return exigir('SUPABASE_TEST_PUBLISHABLE_KEY')
}

export function claveDeServicioDePrueba(): string {
  return exigir('SUPABASE_TEST_SERVICE_ROLE_KEY')
}

function exigir(variable: string): string {
  const valor = process.env[variable]
  if (!valor) {
    throw new Error(
      `Falta la variable de entorno ${variable}. Los contratos contra Supabase la necesitan.`,
    )
  }
  return valor
}

/**
 * Email unico por ejecucion: el mismo usuario no se puede registrar dos veces
 * en la misma base, asi que cada test necesita el suyo.
 *
 * El dominio no puede ser `example.com`: GoTrue lo rechaza como invalido.
 */
export function emailDePrueba(prefijo: string): string {
  const marca = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  const dominio = process.env.SUPABASE_TEST_DOMAIN ?? 'utnfrh.edu.ar'
  return `${prefijo}.${marca}@${dominio}`
}
