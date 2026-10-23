import type { SupabaseClient } from '@supabase/supabase-js'
import {
  ServicioDeAutenticacionSupabase,
  RepositorioDePerfilesSupabase,
  RepositorioDePostulacionesSupabase,
  RepositorioDePeriodosSupabase,
  RepositorioDeDocumentosSupabase,
  AlmacenDeArchivosSupabase,
  AccionesDeDocumentacionSupabase,
  AccionesDelPersonalSupabase,
  RegistroDePagosSupabase,
  RegistroDeCargasSupabase,
  LectorDeInformeProvisorio,
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
  ListarPeriodosTodosUseCase,
  ConsultarPeriodoUseCase,
  ConsultarOcupacionUseCase,
  ListarPostulacionesUseCase,
  BuscarPostulacionesPorDniUseCase,
  ModificarPeriodoUseCase,
  AcreditarPagoManualUseCase,
  ProrrogarPlazoDePagoUseCase,
  ActualizarPerfilUseCase,
  ActualizarPerfilPropioUseCase,
  ListarPerfilesUseCase,
  ListarDocumentosUseCase,
  ConsultarDocumentoUseCase,
  SubirDocumentoUseCase,
  RevisarDocumentoUseCase,
  ActualizarDocumentoUseCase,
  EliminarDocumentoUseCase,
  AcreditarPagoUseCase,
  ImportarInformeDePagosUseCase,
  ListarBandejaUseCase,
  ListarCargasDeInformeUseCase,
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
  const repoDocumentos = new RepositorioDeDocumentosSupabase(supabase)
  const almacen = new AlmacenDeArchivosSupabase(supabase)
  const accionesDeDocumentacion = new AccionesDeDocumentacionSupabase(supabase)
  const reloj = new RelojDeSistema()
  const generadorDeIds = new GeneradorDeIdsCrypto()
  const registroDePagos = new RegistroDePagosSupabase(supabase)
  const registroDeCargas = new RegistroDeCargasSupabase(supabase)
  const acreditarPago = new AcreditarPagoUseCase(
    repoPostulaciones,
    repoPeriodos,
    repoPerfiles,
    registroDePagos,
  )

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
    listarPerfiles: new ListarPerfilesUseCase(repoPerfiles),
    crearPostulacion: new CrearPostulacionUseCase(repoPostulaciones, repoPeriodos, reloj),
    iniciarPago: new IniciarPagoUseCase(repoPostulaciones, repoPeriodos, reloj),
    consultarPostulacion: new ConsultarPostulacionUseCase(repoPostulaciones, reloj),
    listarPostulaciones: new ListarPostulacionesUseCase(repoPostulaciones, reloj),
    buscarPostulacionesPorDni: new BuscarPostulacionesPorDniUseCase(repoPostulaciones, reloj),
    crearPeriodo: new CrearPeriodoUseCase(repoPeriodos, generadorDeIds, reloj),
    modificarPeriodo: new ModificarPeriodoUseCase(repoPeriodos, reloj),
    listarPeriodosAbiertos: new ListarPeriodosAbiertosUseCase(repoPeriodos, reloj),
    listarPeriodosTodos: new ListarPeriodosTodosUseCase(repoPeriodos),
    consultarPeriodo: new ConsultarPeriodoUseCase(repoPeriodos),
    consultarOcupacion: new ConsultarOcupacionUseCase(repoPeriodos, reloj),
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
    // Informe de pagos (US1). El lector es el del formato provisorio hasta que llegue el real (T04).
    lectorDeInforme: new LectorDeInformeProvisorio(),
    acreditarPago,
    importarInformeDePagos: new ImportarInformeDePagosUseCase(registroDeCargas, acreditarPago),
    listarBandeja: new ListarBandejaUseCase(registroDePagos),
    listarCargasDeInforme: new ListarCargasDeInformeUseCase(registroDeCargas),
    actualizarPerfil: new ActualizarPerfilUseCase(repoPerfiles),
    actualizarPerfilPropio: new ActualizarPerfilPropioUseCase(repoPerfiles),
    listarDocumentos: new ListarDocumentosUseCase(
      repoDocumentos,
      repoPostulaciones,
      repoPeriodos,
    ),
    consultarDocumento: new ConsultarDocumentoUseCase(
      repoDocumentos,
      repoPostulaciones,
      repoPeriodos,
      almacen,
    ),
    subirDocumento: new SubirDocumentoUseCase(
      repoDocumentos,
      repoPostulaciones,
      repoPeriodos,
      accionesDeDocumentacion,
      almacen,
      generadorDeIds,
      reloj,
    ),
    revisarDocumento: new RevisarDocumentoUseCase(
      repoDocumentos,
      repoPostulaciones,
      repoPeriodos,
      accionesDeDocumentacion,
      reloj,
    ),
    actualizarDocumento: new ActualizarDocumentoUseCase(
      repoDocumentos,
      repoPostulaciones,
      repoPeriodos,
      reloj,
    ),
    eliminarDocumento: new EliminarDocumentoUseCase(
      repoDocumentos,
      repoPostulaciones,
      repoPeriodos,
      almacen,
      reloj,
    ),
  }
}

export type Dependencias = ReturnType<typeof crearDependencias>
