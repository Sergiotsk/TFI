import { RepositorioDeUsuariosFake } from '../../packages/application/puertos/repositorio-de-usuarios/fake'
import { RepositorioDeProcedureFake } from '../../packages/application/puertos/repositorio-de-procedure/fake'
import { RepositorioDeDocumentFake } from '../../packages/application/puertos/repositorio-de-document/fake'

// Aquí instanciamos el adaptador que usará toda la app
export const repositorioDeUsuarios = new RepositorioDeUsuariosFake()
export const repositorioDeProcedure = new RepositorioDeProcedureFake()
export const repositorioDeDocument = new RepositorioDeDocumentFake()
