import { PeriodoDeIngreso } from '@tfi/domain'
import { RelojFijo } from '../reloj/fake'
import { RegistroDeCargasFake } from '../registro-de-cargas/fake'
import { RepositorioDePeriodosFake } from '../repositorio-de-periodos/fake'
import { RepositorioDePostulacionesFake } from '../repositorio-de-postulaciones/fake'
import { MATRICULA_DE_PRUEBA_CENTAVOS, probarContratoDeRegistroDePagos } from './contrato'
import { RegistroDePagosFake } from './fake'

const AHORA = new Date('2026-10-20T00:00:00.000Z')
const UN_DIA = 24 * 60 * 60 * 1000
const INSTITUCION = 'institucion-1'

probarContratoDeRegistroDePagos(() => {
  const reloj = new RelojFijo(AHORA)
  const postulaciones = new RepositorioDePostulacionesFake()
  const periodos = new RepositorioDePeriodosFake(postulaciones)
  const cargas = new RegistroDeCargasFake(reloj)
  const registro = new RegistroDePagosFake(postulaciones, periodos, cargas, reloj)
  let contador = 0

  return {
    registro,
    institucionId: INSTITUCION,
    ahora: () => AHORA,
    sembrar: async (datos) => {
      contador += 1
      let periodoId = datos.periodoId
      if (periodoId === undefined) {
        const periodo = new PeriodoDeIngreso(
          `periodo-${contador}`,
          INSTITUCION,
          `Período ${contador}`,
          datos.totalCupos ?? 10,
          new Date(AHORA.getTime() + 30 * UN_DIA),
          3,
          MATRICULA_DE_PRUEBA_CENTAVOS,
        )
        await periodos.guardar(periodo)
        periodoId = periodo.id
      }

      const postulacion = postulaciones.sembrar({
        aspiranteId: `aspirante-${contador}`,
        periodoId,
        estado: datos.estado,
        venceEl: datos.venceEl,
      })

      return { postulacionId: postulacion.id, periodoId }
    },
    sembrarCarga: async () => (await cargas.iniciar(INSTITUCION, 'tesoreria-1', 'informe.csv')).id,
    estadoDe: async (postulacionId) => {
      const postulacion = await postulaciones.obtenerPorId(postulacionId)
      if (!postulacion) throw new Error(`No existe la Postulación ${postulacionId}`)
      return postulacion.estado
    },
    contarOcupados: (periodoId) => periodos.contarOcupados(periodoId),
  }
})
