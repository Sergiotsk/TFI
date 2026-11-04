import type { SupabaseClient } from '@supabase/supabase-js'
import {
  MercadoPagoAdapter,
  ServicioDeAutenticacionSupabase,
  ServicioDeAdministracionDeUsuariosSupabase,
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
  GeneradorDeContrasenasCrypto,
  RepositorioDeIntencionesDePagoSupabase,
} from '@tfi/infrastructure'
import {
  RegistrarAspiranteUseCase,
  IniciarSesionUseCase,
  CerrarSesionUseCase,
  ConsultarPerfilPropioUseCase,
  ObtenerActorUseCase,
  RestablecerContrasenaUseCase,
  SolicitarRecuperacionDeContrasenaUseCase,
  CambiarContrasenaUseCase,
  ConfirmarEnlaceDeEmailUseCase,
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
  IniciarPagoConPasarelaUseCase,
  ProcesarWebhookMercadoPagoUseCase,
} from '@tfi/application'
import { urlBaseDeLaApp, urlDeApp } from '@/lib/url-de-app'
import { crearClienteServiceRole } from '@/lib/supabase/service-role'

// La raíz de composición: el único lugar donde se decide qué implementación se
// usa para cada puerto. Se arma por request porque el cliente de Supabase
// lleva las cookies de la sesión (Next.js).
export function crearDependencias(supabase: SupabaseClient) {
  const appUrl = urlBaseDeLaApp()
  // La URL de la app se inyecta al adaptador: es configuración de la raíz de
  // composición, no algo que el adaptador lea del entorno por su cuenta.
  const auth = new ServicioDeAutenticacionSupabase(supabase, appUrl)
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

  let iniciarPagoConPasarela: IniciarPagoConPasarelaUseCase | undefined

  const habilitarPasarela = process.env.PAGOS_PASARELA === 'mercadopago'
  if (habilitarPasarela && process.env.MP_ACCESS_TOKEN) {
    const pasarela = new MercadoPagoAdapter({ accessToken: process.env.MP_ACCESS_TOKEN })
    const intenciones = new RepositorioDeIntencionesDePagoSupabase(supabase)
    iniciarPagoConPasarela = new IniciarPagoConPasarelaUseCase(
      repoPostulaciones,
      repoPeriodos,
      pasarela,
      reloj,
      () => `int_${generadorDeIds.nuevo()}`,
      () => ({
        backUrls: {
          success: urlDeApp(appUrl, 'pagos/retorno?resultado=success'),
          pending: urlDeApp(appUrl, 'pagos/retorno?resultado=pending'),
          failure: urlDeApp(appUrl, 'pagos/retorno?resultado=failure'),
        },
        notificationUrl: urlDeApp(appUrl, 'api/pagos/webhook/mercadopago'),
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
    solicitarRecuperacionDeContrasena: new SolicitarRecuperacionDeContrasenaUseCase(auth),
    cambiarContrasena: new CambiarContrasenaUseCase(auth),
    confirmarEnlaceDeEmail: new ConfirmarEnlaceDeEmailUseCase(auth),
    listarPerfiles: new ListarPerfilesUseCase(repoPerfiles),
    crearPostulacion: new CrearPostulacionUseCase(repoPostulaciones, repoPeriodos, reloj),
    iniciarPago: new IniciarPagoUseCase(repoPostulaciones, repoPeriodos, reloj),
    iniciarPagoConPasarela,
    consultarPostulacion: new ConsultarPostulacionUseCase(repoPostulaciones, reloj),
    listarPostulaciones: new ListarPostulacionesUseCase(repoPostulaciones, repoPerfiles, reloj),
    buscarPostulacionesPorDni: new BuscarPostulacionesPorDniUseCase(repoPostulaciones, repoPerfiles, reloj),
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
  }
}

export function crearDependenciasSinSesion() {
  const habilitarPasarela = process.env.PAGOS_PASARELA === 'mercadopago'
  const accessToken = process.env.MP_ACCESS_TOKEN
  if (!habilitarPasarela || !accessToken) {
    return { procesarWebhookMercadoPago: undefined }
  }

  // El webhook no tiene sesión: usa la service role key solo para este
  // endpoint. La RPC acreditar_pago reconoce ese rol y aplica las mismas
  // reglas que el informe.
  const supabase = crearClienteServiceRole()
  const repoPerfiles = new RepositorioDePerfilesSupabase(supabase)
  const repoPostulaciones = new RepositorioDePostulacionesSupabase(supabase)
  const repoPeriodos = new RepositorioDePeriodosSupabase(supabase)
  const registroDePagos = new RegistroDePagosSupabase(supabase)
  const intenciones = new RepositorioDeIntencionesDePagoSupabase(supabase)
  const pasarela = new MercadoPagoAdapter({ accessToken })
  const reloj = new RelojDeSistema()

  return {
    procesarWebhookMercadoPago: new ProcesarWebhookMercadoPagoUseCase(
      repoPostulaciones,
      repoPeriodos,
      repoPerfiles,
      registroDePagos,
      pasarela,
      reloj,
      intenciones,
    ),
  }
}

export type Dependencias = ReturnType<typeof crearDependencias>

/**
 * Dependencias que necesitan la service role key.
 *
 * Se arman aparte de `crearDependencias` a propósito: el cliente con
 * privilegios de administrador se crea solo en el endpoint que restablece
 * contraseñas, no en cada request.
 */
export function crearDependenciasDeAdministracion(clienteAdmin: SupabaseClient) {
  const repoPerfiles = new RepositorioDePerfilesSupabase(clienteAdmin)

  return {
    repoPerfiles,
    restablecerContrasena: new RestablecerContrasenaUseCase(
      new ServicioDeAdministracionDeUsuariosSupabase(clienteAdmin),
      repoPerfiles,
      new GeneradorDeContrasenasCrypto(),
    ),
  }
}

export type DependenciasDeAdministracion = ReturnType<typeof crearDependenciasDeAdministracion>
