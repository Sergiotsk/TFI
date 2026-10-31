'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TipoDeDocumento } from '@tfi/domain'
import { Button } from '@/components/ui/button'

interface CorregirDocumentoProps {
  postulacionId: string
  documentoId: string
  tipo: TipoDeDocumento
}

// Demo: reemplaza un documento observado. Primero sube el archivo nuevo (POST /api/documentos, queda PENDIENTE)
// y después borra el observado (DELETE /api/documentos/:id); así nunca queda la Postulación sin el documento.
export function CorregirDocumento({ postulacionId, documentoId, tipo }: CorregirDocumentoProps) {
  const router = useRouter()
  const [archivo, setArchivo] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const corregir = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!archivo) return

    setEnviando(true)
    setError(null)
    try {
      const formulario = new FormData()
      formulario.set('postulacionId', postulacionId)
      formulario.set('tipo', tipo)
      formulario.set('archivo', archivo)

      const subida = await fetch('/api/documentos', { method: 'POST', body: formulario })
      if (!subida.ok) {
        setError(await mensajeDeRespuesta(subida, 'No se pudo subir el archivo nuevo'))
        return
      }

      const baja = await fetch(`/api/documentos/${documentoId}`, { method: 'DELETE' })
      if (!baja.ok) {
        setError(await mensajeDeRespuesta(baja, 'Se subió el archivo nuevo, pero no se pudo quitar el observado'))
        return
      }

      router.refresh()
    } catch {
      setError('No se pudo conectar con el servidor. Probá de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={corregir} className="flex flex-wrap items-center gap-2">
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
        className="text-xs file:mr-2 file:rounded-md file:border file:border-border file:bg-muted file:px-2 file:py-1"
      />
      <Button type="submit" size="sm" disabled={!archivo || enviando}>
        {enviando ? 'Enviando…' : 'Enviar corrección'}
      </Button>
      {error ? (
        <p role="alert" className="w-full text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </form>
  )
}

async function mensajeDeRespuesta(respuesta: Response, predeterminado: string): Promise<string> {
  const cuerpo = (await respuesta.json().catch(() => null)) as { error?: { mensaje?: string } } | null
  return cuerpo?.error?.mensaje ?? predeterminado
}
