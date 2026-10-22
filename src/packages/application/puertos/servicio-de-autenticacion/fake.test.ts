import { probarContratoServicioDeAutenticacion } from './contrato'
import { ServicioDeAutenticacionFake } from './fake'

probarContratoServicioDeAutenticacion(() => new ServicioDeAutenticacionFake())
