import { redirect } from 'next/navigation'
import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { PANEL_DE_ROL } from '@/config/paneles'

export const metadata = {
  title: 'Panel',
  description: 'Panel del aspirante y del personal de la facultad.',
}

// Distribuidor: el login y el registro terminan acá, y cada rol sigue a su panel (config/paneles.ts).
export default async function PaginaPanel() {
  const supabase = await crearCliente()
  const { obtenerActorUseCase } = crearDependencias(supabase)

  const resultado = await obtenerActorUseCase.ejecutar()

  if (resultado.resultado === 'SIN_SESION') {
    redirect('/login')
  }

  if (resultado.resultado === 'SIN_PERFIL') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-foreground">
            Tu cuenta todavía no tiene un perfil
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Escribí a la secretaría de la facultad para regularizar tu inscripción.
          </p>
        </div>
      </main>
    )
  }

  redirect(PANEL_DE_ROL[resultado.actor.rol])
}
