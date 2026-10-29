'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

// Demo: inicia el pago en POST /api/pagos/iniciar y redirige al checkout de Mercado Pago (initPoint).
// La vacante la confirma el webhook; si no llega, el personal acredita el pago a mano.
export function BotonPagarMercadoPago({ postulacionId }: { postulacionId: string }) {
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pagar = async () => {
    setEnviando(true)
    setError(null)
    try {
      const respuesta = await fetch('/api/pagos/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postulacionId }),
      })
      const cuerpo = (await respuesta.json().catch(() => null)) as {
        data?: { initPoint?: string }
        error?: { mensaje?: string }
      } | null
      const initPoint = cuerpo?.data?.initPoint
      if (respuesta.ok && initPoint) {
        window.location.href = initPoint
        return
      }
      setError(cuerpo?.error?.mensaje ?? 'No se pudo iniciar el pago con Mercado Pago')
    } catch {
      setError('No se pudo conectar con el servidor. Probá de nuevo.')
    }
    setEnviando(false)
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <Button type="button" size="lg" disabled={enviando} onClick={pagar}>
        {enviando ? 'Redirigiendo a Mercado Pago…' : 'Pagar con Mercado Pago'}
      </Button>
      {error ? (
        <p role="alert" className="w-full text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
