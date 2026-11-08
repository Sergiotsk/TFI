import { probarContratoDeGeneradorDeIds } from './contrato'
import { GeneradorDeIdsFake } from './fake'

probarContratoDeGeneradorDeIds(() => new GeneradorDeIdsFake())
