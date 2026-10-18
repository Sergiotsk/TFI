// API pública de @tfi/application: lo que no se exporta acá no se puede importar desde otros paquetes.
export type { RepositorioDeUsuarios } from './puertos/repositorio-de-usuarios/puerto'
export { RepositorioDeUsuariosFake } from './puertos/repositorio-de-usuarios/fake'
export type { RepositorioDeProcedure } from './puertos/repositorio-de-procedure/puerto'
export { RepositorioDeProcedureFake } from './puertos/repositorio-de-procedure/fake'
export type { RepositorioDeDocument } from './puertos/repositorio-de-document/puerto'
export { RepositorioDeDocumentFake } from './puertos/repositorio-de-document/fake'
