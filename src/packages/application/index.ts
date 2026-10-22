// API pública de @tfi/application: lo que no se exporta acá no se puede importar desde otros paquetes.
export type { RepositorioDePerfiles } from './puertos/repositorio-de-perfiles/puerto'
export { RepositorioDePerfilesFake } from './puertos/repositorio-de-perfiles/fake'
export type { RepositorioDeDocumentos } from './puertos/repositorio-de-documentos/puerto'
export { RepositorioDeDocumentosFake } from './puertos/repositorio-de-documentos/fake'
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
export { NoAutorizado, NoEncontrado, ConflictoDeEstado } from './casos-de-uso/errores'
export type { Actor } from './casos-de-uso/actor'
export { exigirRol } from './casos-de-uso/actor'
export { CrearPostulacionUseCase } from './casos-de-uso/crear-postulacion'
export { CrearPeriodoUseCase } from './casos-de-uso/crear-periodo'
export type { DatosDeNuevoPeriodo } from './casos-de-uso/crear-periodo'
export { ModificarPeriodoUseCase } from './casos-de-uso/modificar-periodo'
export type { CambiosDePeriodo } from './casos-de-uso/modificar-periodo'
export { ListarPeriodosAbiertosUseCase } from './casos-de-uso/listar-periodos-abiertos'
export { IniciarPagoUseCase } from './casos-de-uso/iniciar-pago'
export { ConsultarPostulacionUseCase } from './casos-de-uso/consultar-postulacion'
export { ListarPostulacionesUseCase } from './casos-de-uso/listar-postulaciones'
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
