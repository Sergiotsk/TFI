// Las suites de contrato son artefactos de test, no API del paquete: viven
// fuera del index para que la app no arrastre vitest al bundle cuando importa
// @tfi/application.
//
// Un adaptador real importa desde acá: import { probarContrato... } from
// '@tfi/application/contratos'.
export { probarContratoServicioDeAutenticacion } from '../puertos/servicio-de-autenticacion/contrato'
export { probarContratoRepositorioDePerfiles } from '../puertos/repositorio-de-perfiles/contrato'
export { probarContratoRepositorioDeDocumentos } from '../puertos/repositorio-de-documentos/contrato'
export type { EntornoDeDocumentos } from '../puertos/repositorio-de-documentos/contrato'
export { probarContratoDeAlmacenDeArchivos } from '../puertos/almacen-de-archivos/contrato'
export { probarContratoDeReloj } from '../puertos/reloj/contrato'
export { probarContratoDeGeneradorDeIds } from '../puertos/generador-de-ids/contrato'
export { probarContratoDeAccionesDelPersonal } from '../puertos/acciones-del-personal/contrato'
export { probarContratoDeRepositorioDePostulaciones } from '../puertos/repositorio-de-postulaciones/contrato'
export type {
  DatosDePeriodoDePrueba,
  EntornoDePostulaciones,
} from '../puertos/repositorio-de-postulaciones/contrato'
export { probarContratoDeRepositorioDePeriodos } from '../puertos/repositorio-de-periodos/contrato'
export type { EntornoDePeriodos } from '../puertos/repositorio-de-periodos/contrato'
