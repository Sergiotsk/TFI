import { RepositorioDeUsuariosFake } from '../../packages/application/puertos/repositorio-de-usuarios/fake'

// Aquí instanciamos el adaptador que usará toda la app
export const repositorioDeUsuarios = new RepositorioDeUsuariosFake()
