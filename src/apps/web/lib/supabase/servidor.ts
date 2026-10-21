import { cookies } from 'next/headers'
import { crearClienteSupabase } from '@tfi/infrastructure/supabase/servidor'
import { leerEntorno } from '@/config/entorno'

/**
 * Cliente de Supabase para el servidor, atado a las cookies de la peticion.
 *
 * Las cookies se pueden escribir en Route Handlers y Server Actions (ahi
 * `cookies()` es mutable). En Server Components son de solo lectura: cuando
 * Supabase intenta refrescar el token ahi, la excepcion se ignora en el
 * adaptador y la sesion sigue vigente hasta que expire.
 */
export async function crearCliente() {
  const entorno = leerEntorno()
  const cookiesDeLaPeticion = await cookies()

  return crearClienteSupabase(
    entorno.NEXT_PUBLIC_SUPABASE_URL,
    entorno.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      getAll: () => cookiesDeLaPeticion.getAll(),
      setAll: (nuevas) => {
        for (const { name, value, options } of nuevas) {
          cookiesDeLaPeticion.set(name, value, options)
        }
      },
    },
  )
}
