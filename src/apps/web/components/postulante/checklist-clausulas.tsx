'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChecklistClausulasProps {
  idPostulacion: string
}

const clausulas = [
  {
    id: 1,
    texto:
      'Entiendo que estoy iniciando formalmente el proceso de ingreso a la Tecnicatura Universitaria en Programación de la Universidad Tecnológica Nacional - Facultad Regional Haedo.',
  },
  {
    id: 2,
    texto:
      'Entiendo y asumo el compromiso de cargar la documentación obligatoria y legalizada dentro del plazo improrrogable de diez (10) días hábiles posteriores al pago. (Analítico o Analítico en Trámite, DNI, etc.)',
  },
  {
    id: 3,
    texto:
      'Certifico bajo juramento que cumplo con los requisitos mínimos de admisión (Nivel Secundario completo sin adeudar materias a la fecha de matriculación efectiva).',
  },
  {
    id: 4,
    texto:
      'Entiendo que en caso de comprobación de falta de documentación, falsedad o vencimiento de plazos estipulados, perdería automáticamente el cupo reservado y el derecho a reintegro o reembolso alguno.',
  },
  {
    id: 5,
    texto:
      'Entiendo que el proceso continúa inmediatamente con el abono de la reserva de cupo arancelada de $100.000 ARS a fin de señar válidamente mi vacante académica.',
  },
  {
    id: 6,
    texto:
      'He leído íntegramente, comprendo en su totalidad y acepto sin reservas las condiciones generales del reglamento de ingreso de la UTN Haedo para el ciclo 2026.',
  },
]

export function ChecklistClausulas({ idPostulacion }: ChecklistClausulasProps) {
  const [seleccionados, setSeleccionados] = useState<number[]>([])

  const todosSeleccionados = seleccionados.length === clausulas.length

  const handleToggle = (id: number) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleMarcarTodos = () => {
    if (todosSeleccionados) {
      setSeleccionados([])
    } else {
      setSeleccionados(clausulas.map((c) => c.id))
    }
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
        <div>
          <h3 className="font-semibold text-foreground text-base">
            Declaración jurada y conformidad del postulante
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Marcá individualmente cada cláusula para habilitar el pago de la reserva.
          </p>
        </div>
        <button
          type="button"
          onClick={handleMarcarTodos}
          className="text-xs font-semibold text-primary hover:underline shrink-0 ml-3 cursor-pointer"
        >
          {todosSeleccionados ? 'Desmarcar todos' : 'Marcar todos'}
        </button>
      </div>

      <div className="space-y-2">
        {clausulas.map((clausula) => {
          const checked = seleccionados.includes(clausula.id)
          return (
            <label
              key={clausula.id}
              className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition ${
                checked ? 'bg-accent/30' : 'hover:bg-muted/50'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => handleToggle(clausula.id)}
                className="mt-0.5 w-4 h-4 text-primary rounded border-input focus:ring-primary"
              />
              <span className="text-xs text-foreground/80 leading-relaxed">
                {clausula.texto}
              </span>
            </label>
          )
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs text-muted-foreground font-medium">
          {seleccionados.length} de {clausulas.length} cláusulas obligatorias confirmadas
        </span>

        {todosSeleccionados ? (
          <Button asChild className="w-full sm:w-auto shrink-0 whitespace-nowrap px-5">
            <Link href={`/postulacion/${idPostulacion}/pago`} className="inline-flex items-center justify-center gap-2">
              <span>Continuar a Datos y Pago de Reserva</span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          </Button>
        ) : (
          <Button disabled className="w-full sm:w-auto shrink-0 whitespace-nowrap px-5 inline-flex items-center justify-center gap-2">
            <span>Continuar a Datos y Pago de Reserva</span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </Button>
        )}
      </div>
    </div>
  )
}