import { describe, expect, it } from 'vitest'
import { Monto, PeriodoDeIngreso, ReferenciaDePago, type Rol } from '@tfi/domain'
import { RegistroDeCargasFake } from '../puertos/registro-de-cargas/fake'
import { RegistroDePagosFake } from '../puertos/registro-de-pagos/fake'
import { RelojFijo } from '../puertos/reloj/fake'
import { RepositorioDePeriodosFake } from '../puertos/repositorio-de-periodos/fake'
import { RepositorioDePostulacionesFake } from '../puertos/repositorio-de-postulaciones/fake'
import type { Actor } from './actor'
import { DecidirPagoExcepcionalUseCase } from './decidir-pago-excepcional'
import { ConflictoDeEstado, NoAutorizado } from './errores'

const AHORA = new Date('2026-10-20T12:00:00.000Z')
const INSTITUCION = 'institucion-1'

const actor = (rol: Rol): Actor => ({ perfilId: `${rol}-1`, rol, institucionId: INSTITUCION })

// Un período de 1 cupo ya ocupado y una Postulación pendiente cuyo pago quedó A_DECIDIR por SIN_CUPO.
async function armarCasoSinCupo() {
  const reloj = new RelojFijo(AHORA)
  const postulaciones = new RepositorioDePostulacionesFake()
  const periodos = new RepositorioDePeriodosFake(postulaciones)
  const cargas = new RegistroDeCargasFake(reloj)
  const pagos = new RegistroDePagosFake(postulaciones, periodos, cargas, reloj)

  await periodos.guardar(
    new PeriodoDeIngreso('periodo-1', INSTITUCION, 'Período', 1, new Date('2026-12-01'), 3, 1_500_000),
  )
  postulaciones.sembrar({ aspiranteId: 'a-1', periodoId: 'periodo-1', estado: 'VACANTE_CONFIRMADA' })
  const pendiente = postulaciones.sembrar({
    aspiranteId: 'a-2',
    periodoId: 'periodo-1',
    estado: 'PAGO_PENDIENTE',
    venceEl: new Date('2026-10-25'),
  })

  const resultado = await pagos.registrarAcreditacion(
    { referencia: new ReferenciaDePago('INFORME_SYSADMIN', 'r-1'), monto: new Monto(1_500_000), pagadoEl: AHORA },
    { tipo: 'REVISION', postulacionId: pendiente.id, estadoEsperado: 'PAGO_PENDIENTE', motivo: 'SIN_CUPO' },
  )
  if (resultado.tipo !== 'REGISTRADO') throw new Error('No se pudo armar el caso')

  return {
    decidir: new DecidirPagoExcepcionalUseCase(pagos),
    pagos,
    postulaciones,
    periodos,
    pagoId: resultado.pago.id,
    postulacionId: pendiente.id,
  }
}

describe('DecidirPagoExcepcional', () => {
  it('aceptar un caso SIN_CUPO confirma la vacante aunque exceda el cupo y registra quién decidió', async () => {
    const { decidir, pagos, postulaciones, periodos, pagoId, postulacionId } = await armarCasoSinCupo()

    const pago = await decidir.ejecutar(actor('DIRECCION'), pagoId, 'ACEPTAR', 'Se amplía el cupo')

    expect(pago.estado).toBe('ACREDITADO')
    expect((await postulaciones.obtenerPorId(postulacionId))?.estado).toBe('VACANTE_CONFIRMADA')
    expect(await periodos.contarOcupados('periodo-1')).toBe(2)
    expect(pagos.decisionesRegistradas()).toEqual([
      expect.objectContaining({
        pagoId,
        decision: 'ACEPTAR',
        decididaPor: 'DIRECCION-1',
        decididaEl: AHORA,
        comentario: 'Se amplía el cupo',
      }),
    ])
  })

  it('rechazar deja la Postulación VENCIDO y el pago DEVUELTO', async () => {
    const { decidir, postulaciones, pagoId, postulacionId } = await armarCasoSinCupo()

    const pago = await decidir.ejecutar(actor('DIRECCION'), pagoId, 'RECHAZAR')

    expect(pago.estado).toBe('DEVUELTO')
    expect((await postulaciones.obtenerPorId(postulacionId))?.estado).toBe('VENCIDO')
  })

  it('un comentario en blanco no se guarda', async () => {
    const { decidir, pagos, pagoId } = await armarCasoSinCupo()

    await decidir.ejecutar(actor('DIRECCION'), pagoId, 'RECHAZAR', '   ')

    expect(pagos.decisionesRegistradas()[0]?.comentario).toBeUndefined()
  })

  it.each<Rol>(['TESORERIA', 'SECRETARIA', 'ASPIRANTE'])('%s no puede decidir', async (rol) => {
    const { decidir, pagos, pagoId } = await armarCasoSinCupo()

    await expect(decidir.ejecutar(actor(rol), pagoId, 'ACEPTAR')).rejects.toBeInstanceOf(NoAutorizado)
    expect(pagos.decisionesRegistradas()).toHaveLength(0)
  })

  it('una segunda decisión sobre el mismo pago es un conflicto', async () => {
    const { decidir, postulaciones, pagoId, postulacionId } = await armarCasoSinCupo()
    await decidir.ejecutar(actor('DIRECCION'), pagoId, 'ACEPTAR')

    await expect(decidir.ejecutar(actor('DIRECCION'), pagoId, 'RECHAZAR')).rejects.toBeInstanceOf(
      ConflictoDeEstado,
    )
    expect((await postulaciones.obtenerPorId(postulacionId))?.estado).toBe('VACANTE_CONFIRMADA')
  })
})
