import { RepositorioDeDocumentFake, RepositorioDeProcedureFake, RepositorioDePerfilesFake } from '@tfi/application'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ServicioDeAutenticacionSupabase, RepositorioDePerfilesSupabase } from '@tfi/infrastructure'
import {
  RegistrarAspiranteUseCase,
  IniciarSesionUseCase,
  CerrarSesionUseCase,
  ConsultarPerfilPropioUseCase,
  ObtenerActorUseCase,
} from '@tfi/application'

// Adaptadores legacy (se van a reemplazar en el avance de la feature)
export const repositorioDePerfiles = new RepositorioDePerfilesFake()
export const repositorioDeProcedure = new RepositorioDeProcedureFake()
export const repositorioDeDocument = new RepositorioDeDocumentFake()

export function crearDependencias(supabase: SupabaseClient) {
  const auth = new ServicioDeAutenticacionSupabase(supabase)
  const repoPerfiles = new RepositorioDePerfilesSupabase(supabase)

  return {
    supabase,
    auth,
    repoPerfiles,
    registrarAspirante: new RegistrarAspiranteUseCase(auth),
    iniciarSesion: new IniciarSesionUseCase(auth),
    cerrarSesion: new CerrarSesionUseCase(auth),
    consultarPerfilPropio: new ConsultarPerfilPropioUseCase(auth, repoPerfiles),
    obtenerActorUseCase: new ObtenerActorUseCase(auth, repoPerfiles),
  }
}

export type Dependencias = ReturnType<typeof crearDependencias>
