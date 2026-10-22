import type { Actor } from '@tfi/application'
import { crearCliente } from '@/lib/supabase/servidor'
import { crearDependencias } from '@/composition-root'

export type ResultadoActorHttp =
  | { tipo: 'OK'; actor: Actor }
  | { tipo: 'SIN_SESION' }
  | { tipo: 'SIN_PERFIL' }

// Arma el Actor desde getUser() + perfil real (primer barrera). Nunca desde cookie propia.
export async function obtenerActor(): Promise<ResultadoActorHttp> {
  const supabase = await crearCliente()
  const { obtenerActorUseCase } = crearDependencias(supabase)

  const resultado = await obtenerActorUseCase.ejecutar()

  if (resultado.resultado === 'SIN_SESION') return { tipo: 'SIN_SESION' }
  if (resultado.resultado === 'SIN_PERFIL') return { tipo: 'SIN_PERFIL' }
  return { tipo: 'OK', actor: resultado.actor }
}
