import type { SupabaseClient } from '@supabase/supabase-js'
import {
  MercadoPagoAdapter,
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
  RepositorioDeIntencionesDePagoSupabase,
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
  DecidirPagoExcepcionalUseCase,
  ListarCasosADecidirUseCase,
} from '@tfi/application'
import { IniciarPagoConPasarelaUseCase } from '@tfi/application'

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let iniciarPagoConPasarela: any | undefined

  const habilitarPasarela = process.env.PAGOS_PASARELA === 'mercadopago'
  if (habilitarPasarela && process.env.MP_ACCESS_TOKEN) {
    const pasarela = new MercadoPagoAdapter({ accessToken: process.env.MP_ACCESS_TOKEN })
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const intenciones = new RepositorioDeIntencionesDePagoSupabase(supabase)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    iniciarPagoConPasarela = new (IniciarPagoConPasarelaUseCase as any)(
      repoPostulaciones,
      repoPeriodos,
      pasarela,
      reloj,
      () => `int_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      () => ({
        backUrls: {
          success: `${appUrl}/pagos/retorno?status=success`,
          pending: `${appUrl}/pagos/retorno?status=pending`,
          failure: `${appUrl}/pagos/retorno?status=failure`,
        },
        notificationUrl: `${appUrl}/api/pagos/webhook/mercadopago`,
      }),
      intenciones,
    )
  }

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
    iniciarPagoConPasarela,
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
    // Pagos excepcionales: los decide Dirección (US5).
    listarCasosADecidir: new ListarCasosADecidirUseCase(
      registroDePagos,
      repoPostulaciones,
      repoPeriodos,
      repoPerfiles,
    ),
    decidirPagoExcepcional: new DecidirPagoExcepcionalUseCase(registroDePagos),
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

export function crearDependenciasSinSesion() {
  const habilitarPasarela = process.env.PAGOS_PASARELA === 'mercadopago'
  if (!habilitarPasarela || !process.env.MP_ACCESS_TOKEN) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { procesarWebhookMercadoPago: undefined as any }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { procesarWebhookMercadoPago: undefined as any }
}

export type Dependencias = ReturnType<typeof crearDependencias>
