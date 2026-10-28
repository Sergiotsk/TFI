const ZONA_HORARIA = 'America/Argentina/Buenos_Aires'
const MS_POR_DIA = 24 * 60 * 60 * 1000

// Formatos de fecha y monto de los paneles, en la zona horaria de la institución.
export function formatearFecha(fecha: Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: ZONA_HORARIA,
  }).format(fecha)
}

export type UrgenciaDeVencimiento = 'normal' | 'proximo' | 'vencido'

// Día calendario de la institución contado en días, para restar fechas sin que la hora de UTC corra el día.
function diaEnLaInstitucion(fecha: Date): number {
  const [anio = 0, mes = 1, dia = 1] = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA })
    .format(fecha)
    .split('-')
    .map(Number)
  return Date.UTC(anio, mes - 1, dia) / MS_POR_DIA
}

// Cuánto falta (o pasó) para el vencimiento del pago, en días calendario: "vence mañana", "hace 2 días".
export function describirVencimiento(
  venceEl: Date,
  ahora: Date,
): { texto: string; urgencia: UrgenciaDeVencimiento } {
  const dias = diaEnLaInstitucion(venceEl) - diaEnLaInstitucion(ahora)

  if (venceEl <= ahora) {
    if (dias === 0) return { texto: 'venció hoy', urgencia: 'vencido' }
    if (dias === -1) return { texto: 'venció ayer', urgencia: 'vencido' }
    return { texto: `hace ${-dias} días`, urgencia: 'vencido' }
  }
  if (dias === 0) return { texto: 'vence hoy', urgencia: 'proximo' }
  if (dias === 1) return { texto: 'vence mañana', urgencia: 'proximo' }
  return { texto: `en ${dias} días`, urgencia: 'normal' }
}

export function iniciales(nombre: string): string {
  const letras = nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra.charAt(0).toUpperCase())
    .join('')
  return letras || '?'
}

export function porcentaje(parte: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(100, Math.round((parte / total) * 100))
}

export function formatearMontoEnCentavos(centavos: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(centavos / 100)
}
