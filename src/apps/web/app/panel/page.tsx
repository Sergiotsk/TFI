import { redirect } from 'next/navigation'
import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'
import { BotonCerrarSesion } from '@/components/auth/boton-cerrar-sesion'
import { ETIQUETAS_DE_ROL, INSTITUCION } from '@/config/institucion'

export const metadata = {
  title: 'Panel',
  description: 'Panel del aspirante y del personal de la facultad.',
}

export default async function PaginaPanel() {
  const supabase = await crearCliente()
  const { obtenerActorUseCase, consultarPerfilPropio } = crearDependencias(supabase)

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

  const { actor } = resultado
  const perfil = await consultarPerfilPropio.ejecutar()

  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {INSTITUCION.nombre}
          </p>
          <h1 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
            {perfil ? `Hola, ${perfil.nombre} ${perfil.apellido}` : 'Panel'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {perfil ? perfil.email : 'Tu sesión está activa.'}
          </p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <Dato etiqueta="Rol" valor={ETIQUETAS_DE_ROL[actor.rol]} />
            {perfil ? <Dato etiqueta="DNI" valor={perfil.dni} /> : null}
            {perfil ? <Dato etiqueta="CUIL" valor={perfil.cuil} /> : null}
            {perfil ? (
              <Dato
                etiqueta="Fecha de nacimiento"
                valor={perfil.fechaNacimiento.toISOString().slice(0, 10)}
              />
            ) : null}
          </dl>
        </div>

        <div className="mt-6 flex justify-end">
          <BotonCerrarSesion />
        </div>
      </div>
    </main>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {etiqueta}
      </dt>
      <dd className="mt-1 text-sm text-foreground">{valor}</dd>
    </div>
  )
}
