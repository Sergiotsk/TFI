import { PeriodoDeIngreso } from '@tfi/domain'
import { RelojFijo } from '../reloj/fake'
import { RepositorioDePeriodosFake } from '../repositorio-de-periodos/fake'
import { RepositorioDePostulacionesFake } from '../repositorio-de-postulaciones/fake'
import { probarContratoDeAccionesDelPersonal } from './contrato'
import { AccionesDelPersonalFake } from './fake'

const AHORA = new Date('2026-10-20T00:00:00.000Z')
const UN_DIA = 24 * 60 * 60 * 1000

probarContratoDeAccionesDelPersonal(() => {
  const reloj = new RelojFijo(AHORA)
  const postulaciones = new RepositorioDePostulacionesFake()
  const periodos = new RepositorioDePeriodosFake(postulaciones)
  const acciones = new AccionesDelPersonalFake(postulaciones, periodos, reloj)
  let contador = 0

  return {
    acciones,
    ahora: () => AHORA,
    sembrar: async (datos) => {
      contador += 1
      const periodo = new PeriodoDeIngreso(
        `periodo-${contador}`,
        'institucion-1',
        `Período ${contador}`,
        datos.totalCupos ?? 10,
        datos.cierraEl ?? new Date(AHORA.getTime() + 30 * UN_DIA),
        3,
        1_500_000,
      )
      await periodos.guardar(periodo)

      const venceEl =
        datos.venceEl !== undefined
          ? datos.venceEl
          : datos.estado === 'PAGO_PENDIENTE'
            ? new Date(AHORA.getTime() + 10 * UN_DIA)
            : null

      const postulacion = postulaciones.sembrar({
        aspiranteId: `aspirante-${contador}`,
        periodoId: periodo.id,
        estado: datos.estado,
        venceEl,
      })

      return { postulacionId: postulacion.id, periodoId: periodo.id }
    },
    sembrarOcupados: async (periodoId, cantidad) => {
      for (let i = 0; i < cantidad; i += 1) {
        contador += 1
        postulaciones.sembrar({
          aspiranteId: `ocupado-${contador}`,
          periodoId,
          estado: 'VACANTE_CONFIRMADA',
        })
      }
    },
  }
})
