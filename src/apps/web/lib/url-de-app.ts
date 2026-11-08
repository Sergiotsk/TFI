/**
 * Une la URL base de la app con una ruta interna.
 *
 * `NEXT_PUBLIC_APP_URL` puede venir con barra final; concatenar sin normalizar
 * producía `https://host//api/...`. MercadoPago guardaba esa URL como
 * `notification_url` y sus servidores no seguían el redirect 308, así que el
 * webhook nunca llegaba. Normalizar acá evita depender de cómo se cargó el
 * entorno.
 */
export function urlDeApp(base: string, ruta: string): string {
  return `${base.replace(/\/+$/, '')}/${ruta.replace(/^\/+/, '')}`
}

/**
 * URL pública de la app, sin barra final.
 *
 * Se usa en lo que el servidor le promete a terceros (los `redirectTo` de los
 * emails de Supabase, las `back_urls` de la pasarela, el webhook). En
 * desarrollo cae a `localhost:3000`; en producción es obligatoria: si falta,
 * los emails vuelven al Site URL de Supabase y el webhook apunta a un host
 * equivocado.
 */
export function urlBaseDeLaApp(): string {
  const configurada = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (configurada) return configurada.replace(/\/+$/, '')

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Falta NEXT_PUBLIC_APP_URL: es obligatoria en producción para los enlaces de email y el webhook de pagos.',
    )
  }

  return 'http://localhost:3000'
}

