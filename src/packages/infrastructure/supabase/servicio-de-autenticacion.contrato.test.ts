import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { describe } from 'vitest'
import { probarContratoServicioDeAutenticacion } from '@tfi/application/contratos'
import { ServicioDeAutenticacionSupabase } from './servicio-de-autenticacion'
import {
  clavePublicaDePrueba,
  emailDePrueba,
  hayEntornoDePrueba,
  urlDePrueba,
} from './entorno-de-prueba'

/**
 * El mismo contrato que se corre contra el fake, pero contra la base de verdad:
 * aca se verifica de verdad el alta en Supabase Auth y la sesion que deja.
 *
 * Requiere SUPABASE_TEST_URL y SUPABASE_TEST_PUBLISHABLE_KEY, y que el proyecto
 * tenga la confirmacion de email desactivada (en local, `enable_confirmations = false`).
 */
describe.skipIf(!hayEntornoDePrueba())(
  'contrato: ServicioDeAutenticacion contra Supabase',
  () => {
    probarContratoServicioDeAutenticacion(
      () => {
        const supabase = createServerClient(urlDePrueba(), clavePublicaDePrueba(), {
          cookies: cookiesEnMemoria(),
        })
        return new ServicioDeAutenticacionSupabase(supabase)
      },
      { emailDePrueba: () => emailDePrueba('aspirante') },
    )
  },
)

/**
 * Las cookies viven en memoria: el test necesita que la sesion sobreviva entre
 * `signUp` y `getUser` sin tocar el disco ni el navegador.
 */
function cookiesEnMemoria() {
  const almacen = new Map<string, string>()

  return {
    getAll: () => [...almacen].map(([name, value]) => ({ name, value })),
    setAll: (cookies: { name: string; value: string; options: CookieOptions }[]) => {
      for (const { name, value, options } of cookies) {
        if (options.maxAge === 0) {
          almacen.delete(name)
        } else {
          almacen.set(name, value)
        }
      }
    },
  }
}
