import { FormularioPago } from '@/components/postulante/formulario-pago'
import { Info, Receipt } from 'lucide-react'

export default async function PagoPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent text-primary text-xs font-bold mb-3">
          PASO 2 DE 4 · ARANCELES
        </div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Pago de Seña para Reserva de Vacante
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Completá el abono de la seña oficial para reservar tu lugar en la Tecnicatura Universitaria en Programación.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Formulario de Pago */}
        <div className="lg:col-span-2">
          <div className="bg-card shadow-(--sombra-tarjeta) p-6">
            <FormularioPago />
          </div>
        </div>

        {/* Columna Derecha: Desglose */}
        <div className="space-y-6">
          <div className="bg-card shadow-(--sombra-tarjeta) p-6">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="h-5 w-5 text-primary" />
              <h4 className="font-bold text-foreground text-sm">Resumen de liquidación</h4>
            </div>
            
            <dl className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border">
                <dt className="text-muted-foreground">Concepto</dt>
                <dd className="font-semibold text-foreground">Seña de Reserva TUP</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium text-foreground">$100.000 ARS</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <dt className="text-muted-foreground">Gastos administrativos</dt>
                <dd className="font-medium text-[var(--senal-verde)]">$0 ARS (Bonificado)</dd>
              </div>
              <div className="flex justify-between py-2 border-t border-border">
                <dt className="font-bold text-foreground text-sm">Total a abonar</dt>
                <dd className="font-black text-primary text-base">$100.000 ARS</dd>
              </div>
            </dl>
          </div>

          <div className="bg-card shadow-(--sombra-tarjeta) border-l-4 border-primary p-4 text-xs text-muted-foreground flex gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p>
              Una vez confirmado el pago, contarás con <strong>10 días hábiles</strong> para cargar la documentación respaldatoria requerida.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}