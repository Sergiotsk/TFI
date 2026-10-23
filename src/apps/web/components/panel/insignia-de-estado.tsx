import { cn } from '@/lib/utils'
import type { EstadoPostulacion } from '@tfi/domain'
import type { EstadoPago, MotivoNoImputado, MotivoRevision } from '@/maquetas/datos'

type Tono = 'neutro' | 'aviso' | 'exito' | 'error'

const tonos: Record<Tono, string> = {
  neutro: 'border-border bg-muted text-muted-foreground',
  aviso: 'border-secondary/30 bg-accent text-accent-foreground',
  exito: 'border-primary/30 bg-primary/10 text-primary',
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
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

const estadosDePago: Record<EstadoPago, { etiqueta: string; tono: Tono }> = {
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
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        tonos[tono],
      )}
    >
      {etiqueta}
    </span>
  )
}

export function InsigniaDePostulacion({ estado }: { estado: EstadoPostulacion }) {
  return <Insignia {...estadosDePostulacion[estado]} />
}

export function InsigniaDePago({ estado }: { estado: EstadoPago }) {
  return <Insignia {...estadosDePago[estado]} />
}
