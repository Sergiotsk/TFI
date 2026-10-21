/**
 * Redirecciones internas: un destino que viene de la URL no puede mandar al
 * usuario a otro sitio (open redirect).
 */
export function redireccionValida(destino: string | null | undefined): destino is string {
  if (!destino) return false
  if (!destino.startsWith('/')) return false
  if (destino.startsWith('//')) return false
  return true
}

export function destinoSeguro(
  destino: string | null | undefined,
  porDefecto: string,
): string {
  return redireccionValida(destino) ? destino : porDefecto
}
