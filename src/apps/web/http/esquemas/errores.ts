import type { ZodError } from 'zod'

/**
 * Convierte los problemas de Zod en un mapa campo -> mensaje, para que la UI
 * pueda marcar el input que fallo y no mostrar un unico error generico.
 */
export function detallesDeZod(error: ZodError): Record<string, string> {
  const detalles: Record<string, string> = {}

  for (const issue of error.issues) {
    const campo = issue.path.join('.') || 'formulario'
    if (!(campo in detalles)) {
      detalles[campo] = issue.message
    }
  }

  return detalles
}
