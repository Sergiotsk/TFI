'use client'

import { useState, useRef, useEffect } from 'react'
import { User } from 'lucide-react'
import { BotonCerrarSesion } from '@/components/auth/boton-cerrar-sesion'

interface MenuUsuarioHeaderProps {
  nombreCompleto: string
  dni?: string
}

export function MenuUsuarioHeader({ nombreCompleto, dni }: MenuUsuarioHeaderProps) {
  const [abierto, setAbierto] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Cerrar el menú si se hace clic afuera
  useEffect(() => {
    function handleClickAfuera(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickAfuera)
    return () => document.removeEventListener('mousedown', handleClickAfuera)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="flex items-center gap-2 rounded-full p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#005a9c]/20"
        title="Perfil de usuario"
      >
        <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700">
          <User className="w-4 h-4" />
        </div>
      </button>

      {/* Menú desplegable */}
      {abierto && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-4 py-2 border-b border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Sesión iniciada
            </span>
            <p className="text-sm font-bold text-slate-900 truncate">
              {nombreCompleto}
            </p>
            {dni && (
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                DNI: {dni}
              </p>
            )}
          </div>

          <div className="px-2 pt-2">
            <div className="[&>button]:w-full [&>button]:flex [&>button]:items-center [&>button]:gap-2 [&>button]:text-left [&>button]:px-2.5 [&>button]:py-2 [&>button]:text-xs [&>button]:font-medium [&>button]:text-rose-600 [&>button]:hover:bg-rose-50 [&>button]:rounded-lg [&>button]:transition">
              <BotonCerrarSesion />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}