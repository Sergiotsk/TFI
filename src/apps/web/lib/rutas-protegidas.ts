// Primera barrera: sin sesión, el proxy manda al login. La autorización por rol la verifica el caso de uso
// (Principio VII), así que acá alcanza con saber qué rutas exigen sesión.
const RUTAS_PROTEGIDAS_POR_PREFIJO = ['/panel', '/aspirante', '/personal', '/direccion']

/** `true` si la ruta es un prefijo protegido o una subruta suya (`/personal` y `/personal/pagos`, no `/personalizado`). */
export function esRutaProtegida(pathname: string): boolean {
  return RUTAS_PROTEGIDAS_POR_PREFIJO.some(
    (prefijo) => pathname === prefijo || pathname.startsWith(`${prefijo}/`),
  )
}
