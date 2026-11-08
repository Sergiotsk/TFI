/**
 * Redirecciones internas: un destino que viene de la URL no puede mandar al
 * usuario a otro sitio (open redirect).
 *
 * El navegador trata la barra invertida como una barra y descarta tabulaciones y
 * saltos de línea: `/\\evil.com` termina siendo `//evil.com`. Por eso se rechazan
 * esos caracteres y se resuelve el destino como lo haría el navegador.
 */
const ORIGEN_DE_REFERENCIA = 'http://destino.invalid'

export function redireccionValida(destino: string | null | undefined): destino is string {
  if (!destino?.startsWith('/')) return false
  if (/[\\\t\r\n]/.test(destino)) return false

  try {
    return new URL(destino, ORIGEN_DE_REFERENCIA).origin === ORIGEN_DE_REFERENCIA
  } catch {
    return false
  }
}

export function destinoSeguro(
  destino: string | null | undefined,
  porDefecto: string,
): string {
  return redireccionValida(destino) ? destino : porDefecto
}
