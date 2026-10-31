import { cn } from '@/lib/utils'
import type { EstadoDePago, EstadoPostulacion, MotivoNoImputado, MotivoRevision } from '@tfi/domain'

type Tono = 'neutro' | 'aviso' | 'exito' | 'error'

const tonos: Record<Tono, string> = {
  neutro: 'border-border bg-muted text-muted-foreground',
  aviso: 'border-secondary/30 bg-accent text-accent-foreground',
  exito: 'border-primary/30 bg-primary/10 text-primary',
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
}

// El punto refuerza el tono sin depender solo del fondo, que en algunos estados es muy claro.
const puntos: Record<Tono, string> = {
  neutro: 'bg-muted-foreground/60',
  aviso: 'bg-secondary',
  exito: 'bg-primary',
  error: 'bg-destructive',
}

const estadosDePostulacion: Record<EstadoPostulacion, { etiqueta: string; tono: Tono }> = {
  PREINSCRIPTO: { etiqueta: 'Preinscripto', tono: 'neutro' },
  PAGO_PENDIENTE: { etiqueta: 'Pago pendiente', tono: 'aviso' },
  PAGO_EN_REVISION: { etiqueta: 'Pago en revisión', tono: 'aviso' },
  VACANTE_CONFIRMADA: { etiqueta: 'Vacante confirmada', tono: 'exito' },
  VENCIDO: { etiqueta: 'Vencido', tono: 'error' },
  ESPERANDO_DOCUMENTACION: { etiqueta: 'Esperando documentación', tono: 'neutro' },
  DOCUMENTACION_EN_REVISION: { etiqueta: 'Documentación en revisión', tono: 'aviso' },
  OBSERVADO: { etiqueta: 'Observado', tono: 'error' },
  DOCUMENTACION_VALIDADA: { etiqueta: 'Documentación validada', tono: 'exito' },
  CONFIRMADO_PARA_EXPORTAR: { etiqueta: 'Confirmado', tono: 'exito' },
}

const estadosDePago: Record<EstadoDePago, { etiqueta: string; tono: Tono }> = {
  ACREDITADO: { etiqueta: 'Acreditado', tono: 'exito' },
  A_DECIDIR: { etiqueta: 'A decidir', tono: 'aviso' },
  NO_IMPUTADO: { etiqueta: 'No imputado', tono: 'error' },
  DEVUELTO: { etiqueta: 'Devuelto', tono: 'neutro' },
}

export const motivosDeRevision: Record<MotivoRevision, string> = {
  FUERA_DE_PLAZO: 'Pagó fuera de plazo',
  SIN_CUPO: 'Pagó a tiempo, pero no quedan cupos',
}

export const motivosDeNoImputado: Record<MotivoNoImputado, string> = {
  REFERENCIA_DESCONOCIDA: 'Referencia desconocida',
  AMBIGUA: 'El DNI coincide con más de una postulación',
  DNI_NO_COINCIDE: 'El DNI no coincide con el número',
  MONTO_INSUFICIENTE: 'Monto insuficiente',
  YA_TIENE_PAGO: 'La postulación ya tiene un pago',
  SIN_PAGO_INICIADO: 'La postulación no inició el pago',
}

function Insignia({ etiqueta, tono }: { etiqueta: string; tono: Tono }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        tonos[tono],
      )}
    >
      <span aria-hidden="true" className={cn('size-1.5 rounded-full', puntos[tono])} />
      {etiqueta}
    </span>
  )
}

export function InsigniaDePostulacion({ estado }: { estado: EstadoPostulacion }) {
  return <Insignia {...estadosDePostulacion[estado]} />
}

export function InsigniaDePago({ estado }: { estado: EstadoDePago }) {
  return <Insignia {...estadosDePago[estado]} />
}
