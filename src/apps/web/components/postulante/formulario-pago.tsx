'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { QrCode, Banknote, ShieldCheck, ArrowRight, Clock, Mail, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'

type MetodoPago = 'mercadopago' | 'efectivo'

export function FormularioPago() {
  const router = useRouter()
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo')
  const [procesando, setProcesando] = useState(false)
  const [errorPago, setErrorPago] = useState<string | null>(null)

  const handlePagar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorPago(null)
    setProcesando(true)

    if (metodo === 'efectivo') {
      // El aspirante elige abonar en tesorería: avanzamos a la carga de documentación
      // dejando asentado el compromiso de pago pendiente
      router.push('/aspirante/postulacion/documentacion?metodo=efectivo&estado=pago_pendiente')
      return
    }

    // Flujo Mercado Pago
    try {
      const res = await fetch('/api/pagos/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()

      if (data?.init_point || data?.url) {
        window.location.href = data.init_point || data.url
      } else {
        throw new Error(data?.error || 'No se pudo generar la orden de pago en Mercado Pago.')
      }
    } catch (err) {
      setErrorPago(err instanceof Error ? err.message : 'Ocurrió un error al conectar con Mercado Pago.')
      setProcesando(false)
    }
  }

  return (
    <form onSubmit={handlePagar} className="space-y-6">
      <div className="bg-card rounded-xl border border-border p-6 shadow-xs">
        <h3 className="text-base font-semibold text-foreground mb-1">
          Método de pago
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Seleccioná cómo querés abonar la seña de reserva de vacante.
        </p>

        {errorPago && (
          <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-xs font-medium text-destructive">
            {errorPago}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label
            onClick={() => setMetodo('efectivo')}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center cursor-pointer transition ${
              metodo === 'efectivo'
                ? 'border-primary bg-accent/40 font-semibold text-primary'
                : 'border-border hover:bg-muted/50 text-foreground'
            }`}
          >
            <Banknote className="h-6 w-6 mb-2" />
            <span className="text-xs">Pago en efectivo</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Presencial en Tesorería UTN</span>
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
            <span className="text-[10px] text-muted-foreground mt-0.5">Dinero en cuenta, tarjetas o QR</span>
          </label>
        </div>

        {/* Detalle según el método */}
        <div className="mt-6 pt-4 border-t border-border">
          {metodo === 'efectivo' && (
            <div className="bg-muted/40 rounded-xl p-5 border border-border text-xs space-y-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="leading-relaxed text-muted-foreground">
                  Al confirmar esta opción tu postulación avanzará a la carga de documentación con estado <strong>Pago pendiente</strong>. Deberás presentarte en la caja de Tesorería de la Facultad antes de la fecha límite para cancelar el arancel en efectivo.
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-border/60">
                <div className="flex items-center gap-2.5 text-foreground">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <span>
                    <strong>Horario de Tesorería:</strong> Lunes a Viernes de 09:00 a 13:00 y de 15:00 a 20:00 hs.
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-foreground">
                  <Mail className="h-4 w-4 text-primary shrink-0" />
                  <span>
                    <strong>Consultas de Tesorería:</strong>{' '}
                    <a
                      href="mailto:tesoreria@frh.utn.edu.ar"
                      className="font-medium text-primary underline hover:text-primary/80 transition"
                    >
                      tesoreria@frh.utn.edu.ar
                    </a>
                  </span>
                </div>
              </div>
            </div>
          )}

          {metodo === 'mercadopago' && (
            <div className="bg-muted/30 rounded-xl p-4 text-xs text-muted-foreground space-y-2 border border-border">
              <p className="leading-relaxed">
                Al presionar <strong>Pagar con Mercado Pago</strong> serás redirigido a la pasarela externa para efectuar el pago y acreditar la seña de forma automática.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Botón de Confirmación */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Gestión oficial de aranceles · UTN Haedo</span>
        </div>

        <Button
          type="submit"
          disabled={procesando}
          className="w-full sm:w-auto min-w-[260px]"
        >
          <span>
            {procesando
              ? 'Procesando...'
              : metodo === 'efectivo'
              ? 'Confirmar y cargar documentación'
              : 'Pagar con Mercado Pago $100.000'}
          </span>
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}