'use client'

import { Check } from 'lucide-react'

interface BarraProgresoPostulacionProps {
  estado?: string
}

type PasoEstado = 'completado' | 'actual' | 'pendiente'

interface PasoDefinicion {
  id: number
  titulo: string
  subtitulo: string
}

const PASOS: PasoDefinicion[] = [
  { id: 1, titulo: 'Requisitos', subtitulo: 'Condiciones' },
  { id: 2, titulo: 'Pago de seña', subtitulo: 'Reserva de vacante' },
  { id: 3, titulo: 'Documentación', subtitulo: 'Carga de analítico y DNI' },
  { id: 4, titulo: 'Validación', subtitulo: 'Revisión final' },
]

function determinarEstadoPaso(pasoId: number, estado?: string): PasoEstado {
  // Sin postulación: en paso 1
  if (!estado) {
    if (pasoId === 1) return 'actual'
    return 'pendiente'
  }

  // Preinscripto o pago pendiente: paso 1 listo, paso 2 en curso
  if (estado === 'PREINSCRIPTO' || estado === 'PAGO_PENDIENTE' || estado === 'VENCIDO') {
    if (pasoId === 1) return 'completado'
    if (pasoId === 2) return 'actual'
    return 'pendiente'
  }

  // Vacante confirmada: pasos 1 y 2 listos, paso 3 en curso
  if (estado === 'VACANTE_CONFIRMADA') {
    if (pasoId < 3) return 'completado'
    if (pasoId === 3) return 'actual'
    return 'pendiente'
  }

  // Documentación cargada / en revisión / observada: paso 4 en curso
  if (
    estado === 'ESPERANDO_DOCUMENTACION' ||
    estado === 'DOCUMENTACION_EN_REVISION' ||
    estado === 'OBSERVADO'
  ) {
    if (pasoId < 4) return 'completado'
    return 'actual'
  }

  // Aceptada formalmente: todos completos
  if (estado === 'DOCUMENTACION_VALIDADA') {
    return 'completado'
  }

  return 'pendiente'
}

export function BarraProgresoPostulacion({ estado }: BarraProgresoPostulacionProps) {
  return (
    <div className="w-full pt-1">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {PASOS.map((paso) => {
          const estadoPaso = determinarEstadoPaso(paso.id, estado)
          const esCompletado = estadoPaso === 'completado'
          const esActual = estadoPaso === 'actual'

          return (
            <div
              key={paso.id}
              className={`flex items-center gap-2.5 p-2 rounded-md transition ${
                esActual
                  ? 'bg-primary/10 border border-primary/20'
                  : esCompletado
                  ? 'bg-muted/40'
                  : 'opacity-40'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  esCompletado
                    ? 'bg-[var(--senal-verde)] text-white'
                    : esActual
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary/20'
                    : 'bg-muted text-muted-foreground border border-border'
                }`}
              >
                {esCompletado ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : paso.id}
              </div>

              <div className="min-w-0">
                <span
                  className={`block text-xs leading-tight truncate ${
                    esActual ? 'text-primary font-bold' : 'text-foreground font-semibold'
                  }`}
                >
                  {paso.titulo}
                </span>
                <span className="text-[10px] text-muted-foreground truncate block">
                  {paso.subtitulo}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}