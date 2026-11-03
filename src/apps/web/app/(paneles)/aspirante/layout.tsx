import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { Public_Sans } from 'next/font/google'
import { HeaderInstitucional } from '@/components/layout/header-institucional'
import { FooterInstitucional } from '@/components/layout/footer-institucional'
import { crearDependencias } from '@/composition-root'
import { PANEL_DE_ROL } from '@/config/paneles'
import { crearCliente } from '@/lib/supabase/servidor'
import { cn } from '@/lib/utils'

const publicSans = Public_Sans({ subsets: ['latin'], variable: '--font-public-sans' })

function mapearEstadoAPaso(estado?: string): 1 | 2 | 3 | 4 {
  if (!estado) return 1

  // Etapa 2: Pago de la seña
  if (estado === 'PREINSCRIPTO' || estado === 'PAGO_PENDIENTE' || estado === 'VENCIDO') {
    return 2
  }

  // Etapa 3: Pago acreditado, debe cargar documentación
  if (estado === 'VACANTE_CONFIRMADA') {
    return 3
  }

  // Etapa 4: Documentación enviada / en revisión / validada
  if (
    estado === 'ESPERANDO_DOCUMENTACION' ||
    estado === 'DOCUMENTACION_EN_REVISION' ||
    estado === 'OBSERVADO' ||
    estado === 'DOCUMENTACION_VALIDADA'
  ) {
    return 4
  }

  return 1
}

export default async function LayoutDelAspirante({ children }: { children: ReactNode }) {
  const supabase = await crearCliente()
  const { consultarPerfilPropio, consultarPostulacion } = crearDependencias(supabase)
  const perfil = await consultarPerfilPropio.ejecutar()

  if (!perfil) {
    redirect('/panel')
  }
  if (perfil.rol !== 'ASPIRANTE') {
    redirect(PANEL_DE_ROL[perfil.rol as keyof typeof PANEL_DE_ROL])
  }

  let pasoActual: 1 | 2 | 3 | 4 = 1
  try {
    // Si tu caso de uso no lleva parámetros:
    // const propias = await consultarPostulacion.listarMias()
    // Si espera el actor autenticado, pasamos el perfil:
    const propias = await (consultarPostulacion.listarMias as any)(perfil)
    pasoActual = mapearEstadoAPaso(propias[0]?.estado)
  } catch {
    pasoActual = 1
  }

  const dniFormateado = perfil.dni
    ? perfil.dni.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    : ''

  const nombreCompleto = `${perfil.nombre} ${perfil.apellido}`

  return (
    <div 
      data-panel="aspirante" 
      className={cn(publicSans.variable, 'min-h-screen flex flex-col justify-between font-sans text-foreground')}
    >
      <HeaderInstitucional 
        pasoActual={pasoActual}
        dniPostulante={dniFormateado} 
        nombrePostulante={nombreCompleto} 
      />

      <main className="flex-1 w-full">
        {children}
      </main>

      <FooterInstitucional />
    </div>
  )
}