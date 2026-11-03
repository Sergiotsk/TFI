import { Check } from 'lucide-react'

interface StepperProps {
  pasoActual: 1 | 2 | 3 | 4
}

const pasos = [
  { numero: 1, label: 'Requisitos' },
  { numero: 2, label: 'Pago Reserva' },
  { numero: 3, label: 'Documentación' },
  { numero: 4, label: 'Estado Final' },
]

export function Stepper({ pasoActual }: StepperProps) {
  return (
    <div className="hidden lg:flex items-center space-x-6 text-xs">
      {pasos.map((paso, index) => {
        const estaCompletado = paso.numero < pasoActual
        const esActual = paso.numero === pasoActual

        return (
          <div key={paso.numero} className="flex items-center space-x-6">
            <div
              className={`flex items-center font-semibold ${
                esActual
                  ? 'text-primary'
                  : estaCompletado
                  ? 'text-emerald-600'
                  : 'text-muted-foreground'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-[11px] font-bold ${
                  esActual
                    ? 'bg-primary text-primary-foreground'
                    : estaCompletado
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {estaCompletado ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : paso.numero}
              </span>
              {paso.label}
            </div>

            {index < pasos.length - 1 && <div className="w-6 h-px bg-border" />}
          </div>
        )
      })}
    </div>
  )
}