import { describe, expect, it } from 'vitest'
import { Monto, Perfil, PeriodoDeIngreso, ReferenciaDePago, type Rol } from '@tfi/domain'
import { RegistroDeCargasFake } from '../puertos/registro-de-cargas/fake'
import { RegistroDePagosFake } from '../puertos/registro-de-pagos/fake'
import { RelojFijo } from '../puertos/reloj/fake'
import { RepositorioDePerfilesFake } from '../puertos/repositorio-de-perfiles/fake'
import { RepositorioDePeriodosFake } from '../puertos/repositorio-de-periodos/fake'
import { RepositorioDePostulacionesFake } from '../puertos/repositorio-de-postulaciones/fake'
import type { Actor } from './actor'
import { NoAutorizado } from './errores'
import { ListarCasosADecidirUseCase } from './listar-casos-a-decidir'

const AHORA = new Date('2026-10-20T12:00:00.000Z')
const INSTITUCION = 'institucion-1'
const VENCE_EL = new Date('2026-10-25T03:00:00.000Z')

const actor = (rol: Rol): Actor => ({ perfilId: `${rol}-1`, rol, institucionId: INSTITUCION })

async function armarMundo() {
  const reloj = new RelojFijo(AHORA)
  const postulaciones = new RepositorioDePostulacionesFake()
  const periodos = new RepositorioDePeriodosFake(postulaciones)
  const perfiles = new RepositorioDePerfilesFake()
  const cargas = new RegistroDeCargasFake(reloj)
  const pagos = new RegistroDePagosFake(postulaciones, periodos, cargas, reloj)

  await periodos.guardar(
    new PeriodoDeIngreso('periodo-1', INSTITUCION, 'Primer cuatrimestre', 1, new Date('2026-12-01'), 3, 1_500_000),
  )
  await perfiles.guardar(
    new Perfil(
      'aspirante-1',
      'aspirante-1@local.test',
      'Ana',
      'Prueba',
      '30111001',
      '27301110014',
      new Date('2000-01-01'),
      'F',
      null,
      null,
      'ASPIRANTE',
      INSTITUCION,
      true,
      AHORA,
      AHORA,
    ),
  )
  postulaciones.sembrar({ aspiranteId: 'otro', periodoId: 'periodo-1', estado: 'VACANTE_CONFIRMADA' })
  const pendiente = postulaciones.sembrar({
    aspiranteId: 'aspirante-1',
    periodoId: 'periodo-1',
    estado: 'PAGO_PENDIENTE',
    venceEl: VENCE_EL,
  })

  const resultado = await pagos.registrarAcreditacion(
    { referencia: new ReferenciaDePago('INFORME_SYSADMIN', 'r-1'), monto: new Monto(1_500_000), pagadoEl: AHORA },
    { tipo: 'REVISION', postulacionId: pendiente.id, estadoEsperado: 'PAGO_PENDIENTE', motivo: 'SIN_CUPO' },
  )
  if (resultado.tipo !== 'REGISTRADO') throw new Error('No se pudo armar el caso')

  return {
    casos: new ListarCasosADecidirUseCase(pagos, postulaciones, periodos, perfiles),
    pagoId: resultado.pago.id,
    postulacion: pendiente,
  }
}

describe('ListarCasosADecidir', () => {
  it('Dirección ve cada caso con el aspirante, el vencimiento y la ocupación del período', async () => {
    const { casos, pagoId, postulacion } = await armarMundo()

    const lista = await casos.ejecutar(actor('DIRECCION'))

    expect(lista).toHaveLength(1)
    const [caso] = lista
    expect(caso?.pago.id).toBe(pagoId)
    expect(caso?.pago.motivoRevision).toBe('SIN_CUPO')
    expect(caso?.postulacion).toEqual({
      id: postulacion.id,
      numero: postulacion.numero.formatear(),
      venceEl: VENCE_EL,
    })
    expect(caso?.aspirante).toEqual({ nombre: 'Ana', apellido: 'Prueba', dni: '30111001' })
    expect(caso?.periodo).toEqual({ id: 'periodo-1', nombre: 'Primer cuatrimestre', totalCupos: 1, ocupados: 1 })
  })

  it.each<Rol>(['TESORERIA', 'SECRETARIA', 'ASPIRANTE'])('%s no ve los casos', async (rol) => {
    const { casos } = await armarMundo()

    await expect(casos.ejecutar(actor(rol))).rejects.toBeInstanceOf(NoAutorizado)
  })
})
