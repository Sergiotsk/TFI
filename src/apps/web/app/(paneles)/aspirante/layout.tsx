import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { HeaderInstitucional } from '@/components/layout/header-institucional'
import { FooterInstitucional } from '@/components/layout/footer-institucional'
import { crearDependencias } from '@/composition-root'
import { PANEL_DE_ROL } from '@/config/paneles'
import { crearCliente } from '@/lib/supabase/servidor'

export default async function LayoutDelAspirante({ children }: { children: ReactNode }) {
  const supabase = await crearCliente()
  const { consultarPerfilPropio } = crearDependencias(supabase)
  const perfil = await consultarPerfilPropio.ejecutar()

  if (!perfil) {
    redirect('/panel')
  }
  if (perfil.rol !== 'ASPIRANTE') {
    redirect(PANEL_DE_ROL[perfil.rol])
  }

  const dniFormateado = perfil.dni
    ? perfil.dni.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    : ''

  const nombreCompleto = `${perfil.nombre} ${perfil.apellido}`

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f0f3ff] text-slate-800 font-sans">
      {/* Única barra principal integrada */}
      <HeaderInstitucional 
        dniPostulante={dniFormateado} 
        nombrePostulante={nombreCompleto} 
      />

      {/* Contenido */}
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Pie institucional */}
      <FooterInstitucional />
    </div>
  )
}