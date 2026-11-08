'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { errorDeRespuesta } from './corregir-documento'

// Cambia un documento que todavía no se revisó, sin esperar a que Secretaría lo observe.
export function ReemplazarDocumento({ documentoId }: { documentoId: string }) {
  const router = useRouter()
  const [archivo, setArchivo] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reemplazar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!archivo) return

    setEnviando(true)
    setError(null)
    try {
      const formulario = new FormData()
      formulario.set('archivo', archivo)

      const respuesta = await fetch(`/api/documentos/${documentoId}/reemplazo`, {
        method: 'POST',
        body: formulario,
      })
      if (!respuesta.ok) {
        const fallo = await errorDeRespuesta(respuesta)
        setError(fallo?.mensaje ?? 'No se pudo reemplazar el archivo')
        setEnviando(false)
        return
      }

      // Queda bloqueado: el documento cambió de id y este formulario desaparece al refrescar.
      router.refresh()
    } catch {
      setError('No se pudo conectar con el servidor. Probá de nuevo.')
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={reemplazar} className="flex flex-wrap items-center gap-2">
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
        className="text-xs file:mr-2 file:rounded-md file:border file:border-border file:bg-muted file:px-2 file:py-1"
      />
      <Button type="submit" size="sm" variant="outline" disabled={!archivo || enviando}>
        {enviando ? 'Enviando…' : 'Reemplazar'}
      </Button>
      {error ? (
        <p role="alert" className="w-full text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </form>
  )
}
