import { describe } from 'vitest'
import { probarContratoDeRepositorioDePeriodos } from '@tfi/application/contratos'
import { hayEntornoDePruebaConServicio } from './entorno-de-prueba'
import { prepararEntornoDePeriodos } from './prueba/entorno'

/**
 * El mismo contrato que corre contra el fake, pero contra la base de verdad.
 *
 * La ocupación se siembra directo (clave de servicio) porque las transiciones
 * que consumen cupo pasan por la RPC `acreditar_pago` (US1), que todavía no
 * existe.
 */
describe.skipIf(!hayEntornoDePruebaConServicio())(
  'contrato: RepositorioDePeriodos contra Supabase',
  () => {
    probarContratoDeRepositorioDePeriodos(prepararEntornoDePeriodos)
  },
)
