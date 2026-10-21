import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

export function crearClienteSupabase(cookieStore: {
  getAll(): { name: string; value: string }[]
  set(name: string, value: string, options: CookieOptions): void
  delete(name: string, options?: CookieOptions): void
}): SupabaseClient {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Ignorar si se llama desde Server Component sin middleware
          }
        },
      },
    },
  )
}
