import { RelojFijo } from '../reloj/fake'
import { probarContratoDeRegistroDeCargas } from './contrato'
import { RegistroDeCargasFake } from './fake'

probarContratoDeRegistroDeCargas(() => ({
  cargas: new RegistroDeCargasFake(new RelojFijo(new Date('2026-10-20T00:00:00.000Z'))),
  institucionId: 'institucion-1',
  cargadaPor: 'tesoreria-1',
}))
