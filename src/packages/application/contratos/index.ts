// Las suites de contrato son artefactos de test, no API del paquete: viven
// fuera del index para que la app no arrastre vitest al bundle cuando importa
// @tfi/application.
//
// Un adaptador real importa desde acá: import { probarContrato... } from
// '@tfi/application/contratos'.
export { probarContratoServicioDeAutenticacion } from '../puertos/servicio-de-autenticacion/contrato'
export { probarContratoRepositorioDePerfiles } from '../puertos/repositorio-de-perfiles/contrato'
export { probarContratoRepositorioDeDocumentos } from '../puertos/repositorio-de-documentos/contrato'
