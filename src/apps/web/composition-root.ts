import {
  RepositorioDeDocumentFake,
  RepositorioDeProcedureFake,
  RepositorioDeUsuariosFake,
} from '@tfi/application'

// Aquí instanciamos el adaptador que usará toda la app
export const repositorioDeUsuarios = new RepositorioDeUsuariosFake()
export const repositorioDeProcedure = new RepositorioDeProcedureFake()
export const repositorioDeDocument = new RepositorioDeDocumentFake()
