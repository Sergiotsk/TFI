'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, QrCode, Building2, ShieldCheck, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type MetodoPago = 'transferencia' | 'mercadopago' | 'tarjeta'

export function FormularioPago() {
  const router = useRouter()
  const [metodo, setMetodo] = useState<MetodoPago>('transferencia')
  const [procesando, setProcesando] = useState(false)

  const handlePagar = (e: React.FormEvent) => {
    e.preventDefault()
    setProcesando(true)

    // Simulación de pasarela de pago y transición al paso 3 (Documentación)
    setTimeout(() => {
      setProcesando(false)
      router.push('/aspirante/postulacion/documentacion')
    }, 1200)
  }

  return (
    <form onSubmit={handlePagar} className="space-y-6">
      {/* Selección de Método de Pago */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-xs">
        <h3 className="text-base font-semibold text-foreground mb-1">
          Método de pago
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Seleccioná cómo querés abonar la seña de reserva de vacante.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label
            onClick={() => setMetodo('transferencia')}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center cursor-pointer transition ${
              metodo === 'transferencia'
                ? 'border-primary bg-accent/40 font-semibold text-primary'
                : 'border-border hover:bg-muted/50 text-foreground'
            }`}
          >
            <Building2 className="h-6 w-6 mb-2" />
            <span className="text-xs">Transferencia bancaria</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">CBU / Alias UTN</span>
          </label>

          <label
            onClick={() => setMetodo('mercadopago')}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center cursor-pointer transition ${
              metodo === 'mercadopago'
                ? 'border-primary bg-accent/40 font-semibold text-primary'
                : 'border-border hover:bg-muted/50 text-foreground'
            }`}
          >
            <QrCode className="h-6 w-6 mb-2" />
            <span className="text-xs">Mercado Pago</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">QR o dinero en cuenta</span>
          </label>

          <label
            onClick={() => setMetodo('tarjeta')}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center cursor-pointer transition ${
              metodo === 'tarjeta'
                ? 'border-primary bg-accent/40 font-semibold text-primary'
                : 'border-border hover:bg-muted/50 text-foreground'
            }`}
          >
            <CreditCard className="h-6 w-6 mb-2" />
            <span className="text-xs">Tarjeta de débito/crédito</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Acreditación online</span>
          </label>
        </div>

        {/* Detalle según el método */}
        <div className="mt-6 pt-4 border-t border-border">
          {metodo === 'transferencia' && (
            <div className="bg-muted/40 rounded-lg p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Titular:</span>
                <span className="font-semibold text-foreground">UTN Facultad Regional Haedo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CUIT:</span>
                <span className="font-mono font-medium text-foreground">30-54667232-4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Alias:</span>
                <span className="font-mono font-bold text-primary">UTN.HAEDO.TUP</span>
              </div>
            </div>
          )}

          {metodo === 'mercadopago' && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Al confirmar serás redirigido a la pasarela segura para escanear el código QR o pagar con saldo en cuenta.
            </p>
          )}

          {metodo === 'tarjeta' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                type="text"
                placeholder="Número de tarjeta"
                required
              />
              <Input
                type="text"
                placeholder="Nombre como figura en la tarjeta"
                required
              />
            </div>
          )}
        </div>
      </div>

      {/* Botón de Confirmación */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Transacción cifrada y protegida por UTN</span>
        </div>

        <Button
          type="submit"
          disabled={procesando}
          className="w-full sm:w-auto"
        >
          <span>{procesando ? 'Procesando pago...' : 'Confirmar y Pagar $100.000'}</span>
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}