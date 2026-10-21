import type { Actor } from '@tfi/application'
import { ObtenerActorUseCase } from '@tfi/application'
import { RepositorioDePerfilesSupabase, ServicioDeAutenticacionSupabase } from '@tfi/infrastructure'
import { crearCliente } from '@/lib/supabase/servidor'

export type ResultadoActorHttp =
  | { tipo: 'OK'; actor: Actor }
  | { tipo: 'SIN_SESION' }
  | { tipo: 'SIN_PERFIL' }

// Arma el Actor desde getUser() + perfil real (primer barrera). Nunca desde cookie propia.
export async function obtenerActor(): Promise<ResultadoActorHttp> {
  const supabase = await crearCliente()
  const auth = new ServicioDeAutenticacionSupabase(supabase)
  const perfiles = new RepositorioDePerfilesSupabase(supabase)
  const caso = new ObtenerActorUseCase(auth, perfiles)

  const resultado = await caso.ejecutar()

  if (resultado.resultado === 'SIN_SESION') return { tipo: 'SIN_SESION' }
  if (resultado.resultado === 'SIN_PERFIL') return { tipo: 'SIN_PERFIL' }
  return { tipo: 'OK', actor: resultado.actor }
}
