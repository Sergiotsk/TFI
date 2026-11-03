'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function BotonCopiarExpediente({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false)

  const handleCopiar = () => {
    navigator.clipboard.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <button 
      type="button"
      onClick={handleCopiar}
      className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 mt-0.5 md:ml-auto cursor-pointer transition select-none"
    >
      {copiado ? (
        <>
          <Check className="w-3 h-3 text-emerald-600" />
          <span className="text-emerald-600 font-semibold">¡Copiado!</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          <span>Copiar</span>
        </>
      )}
    </button>
  )
}