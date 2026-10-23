// Datos de ejemplo de las pantallas que todavía no tienen backend: la bandeja de pagos (US1) y los casos a decidir
// de Dirección (US5). No son entidades del dominio. Cuando existan los endpoints de contracts/api-http.md, cada
// página reemplaza estos datos por la llamada correspondiente y este archivo se borra.
// Las pantallas del aspirante, las postulaciones y los períodos ya usan los casos de uso reales.

export type EstadoPago = 'A_DECIDIR' | 'NO_IMPUTADO' | 'DEVUELTO'

export type MotivoRevision = 'FUERA_DE_PLAZO' | 'SIN_CUPO'

export type MotivoNoImputado =
  | 'REFERENCIA_DESCONOCIDA'
  | 'AMBIGUA'
  | 'DNI_NO_COINCIDE'
  | 'MONTO_INSUFICIENTE'
  | 'YA_TIENE_PAGO'
  | 'SIN_PAGO_INICIADO'

export interface CasoADecidir {
  pagoId: string
  numero: number
  aspirante: string
  dni: string
  motivo: MotivoRevision
  montoCentavos: number
  pagadoEl: string
  venceEl: string
  ocupados: number
  cupos: number
}

export interface PagoEnBandeja {
  pagoId: string
  estado: Exclude<EstadoPago, 'A_DECIDIR'>
  referencia: string
  dniInformado: string
  montoCentavos: number
  pagadoEl: string
  motivo?: MotivoNoImputado
  aspirante?: string
}

export interface CargaDeInforme {
  id: string
  nombreArchivo: string
  cargadaEl: string
  cargadaPor: string
  acreditados: number
  aDecidir: number
  noImputados: number
  duplicados: number
}

export const casosADecidir: CasoADecidir[] = [
  {
    pagoId: 'pago-1',
    numero: 97,
    aspirante: 'Martina López',
    dni: '44.512.300',
    motivo: 'SIN_CUPO',
    montoCentavos: 9_400_000,
    pagadoEl: '2026-10-19T10:15:00-03:00',
    venceEl: '2026-10-20T23:59:00-03:00',
    ocupados: 50,
    cupos: 50,
  },
  {
    pagoId: 'pago-2',
    numero: 103,
    aspirante: 'Julián Pereyra',
    dni: '43.870.115',
    motivo: 'FUERA_DE_PLAZO',
    montoCentavos: 9_400_000,
    pagadoEl: '2026-10-18T18:40:00-03:00',
    venceEl: '2026-10-16T23:59:00-03:00',
    ocupados: 48,
    cupos: 50,
  },
]

export const pagosEnBandeja: PagoEnBandeja[] = [
  {
    pagoId: 'pago-3',
    estado: 'NO_IMPUTADO',
    referencia: 'P360-88123',
    dniInformado: '40.000.001',
    montoCentavos: 9_400_000,
    pagadoEl: '2026-10-20T09:02:00-03:00',
    motivo: 'REFERENCIA_DESCONOCIDA',
  },
  {
    pagoId: 'pago-4',
    estado: 'NO_IMPUTADO',
    referencia: 'P360-88190',
    dniInformado: '42.331.908',
    montoCentavos: 9_400_000,
    pagadoEl: '2026-10-20T11:47:00-03:00',
    motivo: 'AMBIGUA',
  },
  {
    pagoId: 'pago-5',
    estado: 'DEVUELTO',
    referencia: 'P360-87011',
    dniInformado: '41.205.774',
    montoCentavos: 9_400_000,
    pagadoEl: '2026-10-12T16:20:00-03:00',
    aspirante: 'Sofía Gómez',
  },
]

export const cargasDeInforme: CargaDeInforme[] = [
  {
    id: 'carga-2',
    nombreArchivo: 'informe-sysadmin-2026-10-20.csv',
    cargadaEl: '2026-10-21T08:30:00-03:00',
    cargadaPor: 'Tesorería',
    acreditados: 12,
    aDecidir: 1,
    noImputados: 2,
    duplicados: 0,
  },
  {
    id: 'carga-1',
    nombreArchivo: 'informe-sysadmin-2026-10-19.csv',
    cargadaEl: '2026-10-20T08:12:00-03:00',
    cargadaPor: 'Tesorería',
    acreditados: 9,
    aDecidir: 1,
    noImputados: 0,
    duplicados: 3,
  },
]

export function formatearNumero(numero: number): string {
  return `Nº ${String(numero).padStart(6, '0')}`
}

export function formatearMonto(centavos: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(centavos / 100)
}

export function formatearFecha(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(iso))
}
