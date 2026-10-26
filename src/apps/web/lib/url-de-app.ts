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
