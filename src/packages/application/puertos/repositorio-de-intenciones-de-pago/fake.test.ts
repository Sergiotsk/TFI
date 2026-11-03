import { probarContratoDeRepositorioDeIntencionesDePago } from './contrato'
import { RepositorioDeIntencionesDePagoFake } from './fake'

const AHORA = new Date('2026-10-20T00:00:00.000Z')

let contador = 0

probarContratoDeRepositorioDeIntencionesDePago(() => {
  contador += 1
  const postulacionId = `postulacion-fake-${contador}`
  let external = 0

  return {
    repositorio: new RepositorioDeIntencionesDePagoFake(() => AHORA),
    postulacionId,
    periodoId: `periodo-fake-${contador}`,
    institucionId: 'institucion-fake',
    crearExternalId: () => {
      external += 1
      return `int_fake_${contador}_${external}`
    },
    ahora: () => AHORA,
  }
})
