import type { SupabaseClient } from '@supabase/supabase-js'
import { RepositorioDeDocumentosFake } from '@tfi/application'
import {
  ServicioDeAutenticacionSupabase,
  RepositorioDePerfilesSupabase,
  RepositorioDePostulacionesSupabase,
} from '@tfi/infrastructure'
import {
  RegistrarAspiranteUseCase,
  IniciarSesionUseCase,
  CerrarSesionUseCase,
  ConsultarPerfilPropioUseCase,
  ObtenerActorUseCase,
} from '@tfi/application'

// La raíz de composición: el único lugar donde se decide qué implementación se
// usa para cada puerto. Se arma por request porque el cliente de Supabase
// lleva las cookies de la sesión (Next.js).
export function crearDependencias(supabase: SupabaseClient) {
  const auth = new ServicioDeAutenticacionSupabase(supabase)
  const repoPerfiles = new RepositorioDePerfilesSupabase(supabase)
  const repoPostulaciones = new RepositorioDePostulacionesSupabase(supabase)
  // Los documentos todavía no tienen adaptador: public.documentos se lee con
  // el fake hasta que la feature de documentación los migre (tarea T032).
  const repoDocumentos = new RepositorioDeDocumentosFake()

  return {
    supabase,
    auth,
    repoPerfiles,
    repoPostulaciones,
    repoDocumentos,
    registrarAspirante: new RegistrarAspiranteUseCase(auth),
    iniciarSesion: new IniciarSesionUseCase(auth),
    cerrarSesion: new CerrarSesionUseCase(auth),
    consultarPerfilPropio: new ConsultarPerfilPropioUseCase(auth, repoPerfiles),
    obtenerActorUseCase: new ObtenerActorUseCase(auth, repoPerfiles),
  }
}

export type Dependencias = ReturnType<typeof crearDependencias>
