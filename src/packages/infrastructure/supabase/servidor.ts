import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Almacen de cookies que necesita `@supabase/ssr`.
 *
 * La implementacion vive en el borde (apps/web) porque cada runtime tiene su
 * manera de leer y escribir cookies: ahi se adapta `next/headers` y en el
 * proxy se adapta `NextRequest`.
 */
export interface AlmacenDeCookies {
  getAll(): { name: string; value: string }[]
  setAll(cookies: { name: string; value: string; options: CookieOptions }[]): void
}

/**
 * Crea el cliente de Supabase para uso en el servidor.
 *
 * La URL y la clave llegan por parametro (no se leen de `process.env` aca):
 * la configuracion del entorno es responsabilidad del borde, no del adaptador.
 */
export function crearClienteSupabase(
  url: string,
  clave: string,
  almacen: AlmacenDeCookies,
): SupabaseClient {
  return createServerClient(url, clave, {
    cookies: {
      getAll() {
        return almacen.getAll()
      },
      setAll(cookiesToSet) {
        try {
          almacen.setAll(cookiesToSet)
        } catch {
          // En Server Components las cookies son de solo lectura.
          // Supabase intenta refrescar el token ahi: se ignora y sigue.
        }
      },
    },
  })
}
