'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileCheck, AlertCircle, ArrowRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UploadDocumentosProps {
  idPostulacion: string
}

interface DocumentoItem {
  id: string
  titulo: string
  descripcion: string
  archivo: File | null
}

export function UploadDocumentos({ idPostulacion }: UploadDocumentosProps) {
  const router = useRouter()
  const [documentos, setDocumentos] = useState<DocumentoItem[]>([
    {
      id: 'dni',
      titulo: 'DNI (Frente y Dorso)',
      descripcion: 'Copia legible del Documento Nacional de Identidad en un único archivo.',
      archivo: null,
    },
    {
      id: 'titulo',
      titulo: 'Título Secundario / Constancia de Trámite',
      descripcion: 'Analítico legalizado o constancia original de título en trámite sin adeudar materias.',
      archivo: null,
    },
    {
      id: 'comprobante',
      titulo: 'Comprobante de Pago de Reserva',
      descripcion: 'Comprobante de transferencia bancaria o recibo oficial de Mercado Pago.',
      archivo: null,
    },
  ])

  const [enviando, setEnviando] = useState(false)

  const handleFileChange = (id: string, file: File | null) => {
    setDocumentos((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, archivo: file } : doc))
    )
  }

  const todosCargados = documentos.every((doc) => doc.archivo !== null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!todosCargados) return

    setEnviando(true)
    setTimeout(() => {
      setEnviando(false)
      // Navegación al Paso 4 (Estado Final)
      router.push(`/postulacion/${idPostulacion}/estado`)
    }, 1200)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {documentos.map((doc) => (
          <div
            key={doc.id}
            className="bg-card rounded-xl border border-border p-5 shadow-xs transition hover:border-muted-foreground/30"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  {doc.archivo ? (
                    <FileCheck className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                  {doc.titulo}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">{doc.descripcion}</p>
              </div>

              {doc.archivo && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full self-start sm:self-auto">
                  Cargado
                </span>
              )}
            </div>

            {doc.archivo ? (
              <div className="flex items-center justify-between bg-muted/40 p-3 rounded-lg text-xs">
                <span className="font-medium text-foreground truncate max-w-xs sm:max-w-md">
                  {doc.archivo.name} ({(doc.archivo.size / 1024 / 1024).toFixed(2)} MB)
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleFileChange(doc.id, null)}
                  className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  title="Eliminar archivo"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-border hover:border-primary/60 rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer bg-background hover:bg-accent/20 transition">
                <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                <span className="text-xs font-semibold text-primary">
                  Seleccionar archivo o arrastrar aquí
                </span>
                <span className="text-[10px] text-muted-foreground mt-1">
                  Formatos aceptados: PDF, JPG, PNG (Máx 5MB)
                </span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    handleFileChange(doc.id, file)
                  }}
                />
              </label>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <span className="text-xs text-muted-foreground font-medium">
          {documentos.filter((d) => d.archivo !== null).length} de 3 documentos cargados
        </span>

        <Button
          type="submit"
          disabled={!todosCargados || enviando}
          className="w-full sm:w-auto"
        >
          <span>{enviando ? 'Subiendo documentación...' : 'Confirmar y Finalizar Trámite'}</span>
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}