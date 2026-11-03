import { probarContratoDePasarelaDePago } from './contrato'
import { PasarelaDePagoFake } from './fake'

probarContratoDePasarelaDePago(() => new PasarelaDePagoFake())
