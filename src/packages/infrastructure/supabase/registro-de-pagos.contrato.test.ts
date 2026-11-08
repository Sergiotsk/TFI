import { describe } from 'vitest'
import {
  probarContratoDeRegistroDeCargas,
  probarContratoDeRegistroDePagos,
} from '@tfi/application/contratos'
import { hayEntornoDePruebaConServicio } from './entorno-de-prueba'
import { prepararEntornoDeRegistroDeCargas, prepararEntornoDeRegistroDePagos } from './prueba/entorno'

/**
 * Los contratos de pagos y cargas contra la base, con la sesión de Tesorería:
 * la RPC `acreditar_pago` verifica el rol y la institución adentro, y las
 * cargas pasan por las policies de RLS. Los fixtures se siembran con la clave
 * de servicio.
 */
describe.skipIf(!hayEntornoDePruebaConServicio())('contrato: pagos contra Supabase', () => {
  probarContratoDeRegistroDePagos(prepararEntornoDeRegistroDePagos)
  probarContratoDeRegistroDeCargas(prepararEntornoDeRegistroDeCargas)
})
