import { createClient } from '@supabase/supabase-js'
import { describe } from 'vitest'
import { probarContratoRepositorioDePerfiles } from '@tfi/application/contratos'
import { RepositorioDePerfilesSupabase } from './repositorio-de-perfiles'
import {
  claveDeServicioDePrueba,
  hayEntornoDePruebaConServicio,
  urlDePrueba,
} from './entorno-de-prueba'

/**
 * El mismo contrato que se corre contra el fake, pero contra la base de
 * verdad: aca se verifica que el adaptador lee public.perfiles como espera.
 *
 * Requiere la clave de servicio: el rol anon no tiene SELECT sobre
 * public.perfiles (las politicas RLS lo filtran).
 */
describe.skipIf(!hayEntornoDePruebaConServicio())(
  'contrato: RepositorioDePerfiles contra Supabase',
  () => {
    probarContratoRepositorioDePerfiles(
      () =>
        new RepositorioDePerfilesSupabase(
          createClient(urlDePrueba(), claveDeServicioDePrueba(), {
            auth: { persistSession: false },
          }),
        ),
      // El alta del perfil la hace el trigger crear_perfil_al_registrarse, en
      // la misma transaccion que el usuario de Supabase Auth: RLS y los GRANT
      // no dejan escribir la fila desde la app, y el adaptador no puede
      // implementar guardar() (tarea T045b).
      { escritura: false },
    )
  },
)
