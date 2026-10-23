// Formatos de fecha y monto de los paneles, en la zona horaria de la institución.
export function formatearFecha(fecha: Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(fecha)
}

export function formatearMontoEnCentavos(centavos: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(centavos / 100)
}
