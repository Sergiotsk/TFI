import type { SupabaseClient } from '@supabase/supabase-js'
import { RepositorioDeDocumentosFake } from '@tfi/application'
import {
  ServicioDeAutenticacionSupabase,
  RepositorioDePerfilesSupabase,
  RepositorioDePostulacionesSupabase,
  RepositorioDePeriodosSupabase,
  AccionesDelPersonalSupabase,
  RelojDeSistema,
  GeneradorDeIdsCrypto,
} from '@tfi/infrastructure'
import {
  RegistrarAspiranteUseCase,
  IniciarSesionUseCase,
  CerrarSesionUseCase,
  ConsultarPerfilPropioUseCase,
  ObtenerActorUseCase,
  CrearPostulacionUseCase,
  IniciarPagoUseCase,
  ConsultarPostulacionUseCase,
  CrearPeriodoUseCase,
  ListarPeriodosAbiertosUseCase,
  ListarPostulacionesUseCase,
  ModificarPeriodoUseCase,
  AcreditarPagoManualUseCase,
  ProrrogarPlazoDePagoUseCase,
  ActualizarPerfilUseCase,
} from '@tfi/application'

// La raíz de composición: el único lugar donde se decide qué implementación se
// usa para cada puerto. Se arma por request porque el cliente de Supabase
// lleva las cookies de la sesión (Next.js).
export function crearDependencias(supabase: SupabaseClient) {
  const auth = new ServicioDeAutenticacionSupabase(supabase)
  const repoPerfiles = new RepositorioDePerfilesSupabase(supabase)
  const repoPostulaciones = new RepositorioDePostulacionesSupabase(supabase)
  const repoPeriodos = new RepositorioDePeriodosSupabase(supabase)
  const accionesDelPersonal = new AccionesDelPersonalSupabase(supabase, repoPostulaciones)
  const reloj = new RelojDeSistema()
  const generadorDeIds = new GeneradorDeIdsCrypto()
  // Los documentos todavía no tienen adaptador: public.documentos se lee con
  // el fake hasta que la feature de documentación los migre (tarea T032).
  const repoDocumentos = new RepositorioDeDocumentosFake()

  return {
    supabase,
    auth,
    repoPerfiles,
    repoPostulaciones,
    repoPeriodos,
    reloj,
    repoDocumentos,
    accionesDelPersonal,
    registrarAspirante: new RegistrarAspiranteUseCase(auth),
    iniciarSesion: new IniciarSesionUseCase(auth),
    cerrarSesion: new CerrarSesionUseCase(auth),
    consultarPerfilPropio: new ConsultarPerfilPropioUseCase(auth, repoPerfiles),
    obtenerActorUseCase: new ObtenerActorUseCase(auth, repoPerfiles),
    crearPostulacion: new CrearPostulacionUseCase(repoPostulaciones, repoPeriodos, reloj),
    iniciarPago: new IniciarPagoUseCase(repoPostulaciones, repoPeriodos, reloj),
    consultarPostulacion: new ConsultarPostulacionUseCase(repoPostulaciones, reloj),
    listarPostulaciones: new ListarPostulacionesUseCase(repoPostulaciones, reloj),
    crearPeriodo: new CrearPeriodoUseCase(repoPeriodos, generadorDeIds),
    modificarPeriodo: new ModificarPeriodoUseCase(repoPeriodos),
    listarPeriodosAbiertos: new ListarPeriodosAbiertosUseCase(repoPeriodos, reloj),
    acreditarPagoManual: new AcreditarPagoManualUseCase(
      repoPostulaciones,
      accionesDelPersonal,
      reloj,
    ),
    prorrogarPlazoDePago: new ProrrogarPlazoDePagoUseCase(
      repoPostulaciones,
      repoPeriodos,
      accionesDelPersonal,
      reloj,
    ),
    actualizarPerfil: new ActualizarPerfilUseCase(repoPerfiles),
  }
}

export type Dependencias = ReturnType<typeof crearDependencias>
