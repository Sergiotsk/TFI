// API pública de @tfi/application: lo que no se exporta acá no se puede importar desde otros paquetes.
export type { Pagina, Paginacion } from './paginacion'
export {
  MAXIMO_POR_PAGINA,
  PAGINACION_POR_DEFECTO,
  armarPagina,
  normalizarPaginacion,
  rangoDe,
} from './paginacion'
export type { FiltrosDePerfil, RepositorioDePerfiles } from './puertos/repositorio-de-perfiles/puerto'
export { RepositorioDePerfilesFake } from './puertos/repositorio-de-perfiles/fake'
export type { FiltrosDeDocumento, RepositorioDeDocumentos } from './puertos/repositorio-de-documentos/puerto'
export { RepositorioDeDocumentosFake } from './puertos/repositorio-de-documentos/fake'
export type { AlmacenDeArchivos, ArchivoParaSubir } from './puertos/almacen-de-archivos/puerto'
export { AlmacenDeArchivosFake } from './puertos/almacen-de-archivos/fake'
export type {
  AccionesDeDocumentacion,
  ResultadoDeDocumentacion,
} from './puertos/acciones-de-documentacion/puerto'
export { AccionesDeDocumentacionFake } from './puertos/acciones-de-documentacion/fake'
export { ListarDocumentosUseCase } from './casos-de-uso/documentos/listar-documentos'
export { ConsultarDocumentoUseCase } from './casos-de-uso/documentos/consultar-documento'
export type { DocumentoConUrl } from './casos-de-uso/documentos/consultar-documento'
export { SubirDocumentoUseCase } from './casos-de-uso/documentos/subir-documento'
export type {
  ArchivoDeDocumento,
  DatosDeNuevoDocumento,
} from './casos-de-uso/documentos/subir-documento'
export { RevisarDocumentoUseCase } from './casos-de-uso/documentos/revisar-documento'
export type { RevisionDeDocumento } from './casos-de-uso/documentos/revisar-documento'
export { ActualizarDocumentoUseCase } from './casos-de-uso/documentos/actualizar-documento'
export type { CambiosDeDocumento } from './casos-de-uso/documentos/actualizar-documento'
export { EliminarDocumentoUseCase } from './casos-de-uso/documentos/eliminar-documento'
export type {
  ServicioDeAutenticacion,
  DatosDeRegistro,
  ResultadoDeRegistro,
  ResultadoDeInicioDeSesion,
} from './puertos/servicio-de-autenticacion/puerto'
export { ServicioDeAutenticacionFake } from './puertos/servicio-de-autenticacion/fake'
export { RegistrarAspiranteUseCase } from './casos-de-uso/autenticacion/registrar-aspirante'
export { IniciarSesionUseCase } from './casos-de-uso/autenticacion/iniciar-sesion'
export { CerrarSesionUseCase } from './casos-de-uso/autenticacion/cerrar-sesion'
export { ConsultarPerfilPropioUseCase } from './casos-de-uso/autenticacion/consultar-perfil-propio'
export { ObtenerActorUseCase } from './casos-de-uso/autenticacion/obtener-actor'
export type { ResultadoDeActor } from './casos-de-uso/autenticacion/obtener-actor'
export type {
  ServicioDeAdministracionDeUsuarios,
  ResultadoDeRestablecimiento,
} from './puertos/servicio-de-administracion-de-usuarios/puerto'
export { ServicioDeAdministracionDeUsuariosFake } from './puertos/servicio-de-administracion-de-usuarios/fake'
export {
  RestablecerContrasenaUseCase,
  ROLES_QUE_RESTABLECEN_CONTRASENAS,
} from './casos-de-uso/autenticacion/restablecer-contrasena'
export type { ResultadoDeRestablecimientoDeContrasena } from './casos-de-uso/autenticacion/restablecer-contrasena'
export { contrasenaInicialDe } from './casos-de-uso/autenticacion/contrasena-inicial'
export {
  NoAutorizado,
  NoEncontrado,
  ConflictoDeEstado,
  DatosDuplicados,
  SolicitudInvalida,
} from './casos-de-uso/errores'
export type { Actor } from './casos-de-uso/actor'
export { exigirRol } from './casos-de-uso/actor'
export { CrearPostulacionUseCase } from './casos-de-uso/crear-postulacion'
export { CrearPeriodoUseCase } from './casos-de-uso/crear-periodo'
export type { DatosDeNuevoPeriodo } from './casos-de-uso/crear-periodo'
export { ModificarPeriodoUseCase } from './casos-de-uso/modificar-periodo'
export type { CambiosDePeriodo } from './casos-de-uso/modificar-periodo'
export { ListarPeriodosAbiertosUseCase } from './casos-de-uso/listar-periodos-abiertos'
export { ListarPeriodosTodosUseCase } from './casos-de-uso/listar-periodos-todos'
export { ConsultarPeriodoUseCase } from './casos-de-uso/consultar-periodo'
export { ConsultarOcupacionUseCase } from './casos-de-uso/consultar-ocupacion'
export type { OcupacionDePeriodo } from './casos-de-uso/consultar-ocupacion'
export { IniciarPagoUseCase } from './casos-de-uso/iniciar-pago'
export { ConsultarPostulacionUseCase } from './casos-de-uso/consultar-postulacion'
export { ListarPostulacionesUseCase } from './casos-de-uso/listar-postulaciones'
export { BuscarPostulacionesPorDniUseCase } from './casos-de-uso/buscar-postulaciones-por-dni'
export { AcreditarPagoManualUseCase } from './casos-de-uso/acreditar-pago-manual'
export { ProrrogarPlazoDePagoUseCase } from './casos-de-uso/prorrogar-plazo-de-pago'
export { ActualizarPerfilUseCase } from './casos-de-uso/actualizar-perfil'
export type { CambiosDePerfil } from './casos-de-uso/actualizar-perfil'
export { ActualizarPerfilPropioUseCase } from './casos-de-uso/actualizar-perfil-propio'
export type { CambiosDePerfilPropio } from './casos-de-uso/actualizar-perfil-propio'
export { ListarPerfilesUseCase } from './casos-de-uso/listar-perfiles'
export type {
  AccionesDelPersonal,
  ResultadoDeConfirmacion,
  ResultadoDeProrroga,
} from './puertos/acciones-del-personal/puerto'
export { AccionesDelPersonalFake } from './puertos/acciones-del-personal/fake'
export type { PostulacionConsultada } from './casos-de-uso/postulacion-consultada'
export type { Reloj } from './puertos/reloj/puerto'
export { RelojFijo } from './puertos/reloj/fake'
export type { GeneradorDeIds } from './puertos/generador-de-ids/puerto'
export { GeneradorDeIdsFake } from './puertos/generador-de-ids/fake'
export type {
  FiltrosDePostulacion,
  RepositorioDePostulaciones,
} from './puertos/repositorio-de-postulaciones/puerto'
export { RepositorioDePostulacionesFake } from './puertos/repositorio-de-postulaciones/fake'
export type { DatosDePostulacionSembrada } from './puertos/repositorio-de-postulaciones/fake'
export type { RepositorioDePeriodos } from './puertos/repositorio-de-periodos/puerto'
export { RepositorioDePeriodosFake } from './puertos/repositorio-de-periodos/fake'
export type { RegistroDePagos, ResultadoDeAcreditacion, ResultadoDeDecision } from './puertos/registro-de-pagos/puerto'
export { RegistroDePagosFake } from './puertos/registro-de-pagos/fake'
export type { RegistroDeCargas } from './puertos/registro-de-cargas/puerto'
export { RegistroDeCargasFake } from './puertos/registro-de-cargas/fake'
export { AcreditarPagoUseCase } from './casos-de-uso/acreditar-pago'
export type { ResultadoDeAcreditacionDePago } from './casos-de-uso/acreditar-pago'
export { ImportarInformeDePagosUseCase } from './casos-de-uso/importar-informe-de-pagos'
export type { FilaImportada, ResultadoDeImportacion } from './casos-de-uso/importar-informe-de-pagos'
export { DecidirPagoExcepcionalUseCase } from './casos-de-uso/decidir-pago-excepcional'
export { ListarBandejaUseCase } from './casos-de-uso/listar-bandeja'
export { ListarCasosADecidirUseCase, type CasoADecidir } from './casos-de-uso/listar-casos-a-decidir'
export type { EstadoDeBandeja } from './casos-de-uso/listar-bandeja'
export { ListarCargasDeInformeUseCase } from './casos-de-uso/listar-cargas-de-informe'
export type {
  ErrorDeLectura,
  LectorDeInformeDePagos,
  ResultadoDeLectura,
} from './puertos/lector-de-informe-de-pagos/puerto'

// Mercado Pago (pasarela)
export { IniciarPagoConPasarelaUseCase, type IniciarPagoConPasarelaResultado } from './casos-de-uso/iniciar-pago-con-pasarela'
export { ProcesarWebhookMercadoPagoUseCase, type ResultadoWebhookPago } from './casos-de-uso/procesar-webhook-mercadopago'
export * from './puertos/pasarela-de-pago'
export * from './puertos/repositorio-de-intenciones-de-pago'
