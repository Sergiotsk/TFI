/**
 * URL pública de la app, sin barra final.
 *
 * Se usa en lo que el servidor le promete a terceros (los `redirectTo` de los
 * emails de Supabase). En desarrollo cae a `localhost:3000`; en producción,
 * `NEXT_PUBLIC_APP_URL` tiene que estar cargada o los emails vuelven al Site URL
 * de Supabase.
 */
export function urlBaseDeLaApp(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '')
}
