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
export { NoAutorizado } from './casos-de-uso/errores'
export type { Actor } from './casos-de-uso/actor'
export { exigirRol } from './casos-de-uso/actor'
export type { RepositorioDePostulaciones } from './puertos/repositorio-de-postulaciones/puerto'
