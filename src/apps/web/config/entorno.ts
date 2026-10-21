import { z } from 'zod'

const esquemaEntorno = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('debe ser una URL, por ejemplo http://127.0.0.1:54321'),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1, 'no puede estar vacía'),
})

export type Entorno = z.infer<typeof esquemaEntorno>

/**
 * Lee y valida la configuración de entorno.
 *
 * El acceso a `process.env` es literal a propósito: Next.js solo reemplaza las
 * variables `NEXT_PUBLIC_*` por su valor cuando se acceden de forma literal
 * (`process.env.NEXT_PUBLIC_X`), así que esto también funciona dentro de
 * bundles de cliente. Con acceso dinámico (`process.env[clave]`) no se
 * reemplaza nada y el valor llega como `undefined`.
 *
 * No se valida en el import: si faltara una variable, el build no debe
 * romperse, sino fallar al usar la app con un mensaje que diga qué falta.
 */
export function leerEntorno(): Entorno {
  const resultado = esquemaEntorno.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  })

  if (!resultado.success) {
    const problemas = resultado.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')

    throw new Error(
      `Configuración inválida (${problemas}). ` +
        'Copiá apps/web/.env.example a apps/web/.env.local y completá los valores de `supabase status`.',
    )
  }

  return resultado.data
}
