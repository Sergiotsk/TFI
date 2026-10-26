'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const DEMORA_MS = 4000

// Demo: después de mostrar el resultado del pago, vuelve solo al panel del aspirante.
export function RedireccionAlPanel() {
  const router = useRouter()

  useEffect(() => {
    const temporizador = setTimeout(() => router.replace('/aspirante/postulacion'), DEMORA_MS)
    return () => clearTimeout(temporizador)
  }, [router])

  return (
    <p className="text-xs text-muted-foreground">En unos segundos te llevamos a tu postulación…</p>
  )
}
