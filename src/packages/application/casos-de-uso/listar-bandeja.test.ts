import { describe, expect, it } from 'vitest'
import { Monto, PeriodoDeIngreso, ReferenciaDePago, type Rol } from '@tfi/domain'
import { RegistroDeCargasFake } from '../puertos/registro-de-cargas/fake'
import { RegistroDePagosFake } from '../puertos/registro-de-pagos/fake'
import { RelojFijo } from '../puertos/reloj/fake'
import { RepositorioDePeriodosFake } from '../puertos/repositorio-de-periodos/fake'
import { RepositorioDePostulacionesFake } from '../puertos/repositorio-de-postulaciones/fake'
import type { Actor } from './actor'
import { NoAutorizado } from './errores'
import { ListarBandejaUseCase } from './listar-bandeja'
import { ListarCargasDeInformeUseCase } from './listar-cargas-de-informe'

const AHORA = new Date('2026-10-20T12:00:00.000Z')
const INSTITUCION = 'institucion-1'

const actor = (rol: Rol): Actor => ({ perfilId: `${rol}-1`, rol, institucionId: INSTITUCION })

async function armarMundo() {
  const reloj = new RelojFijo(AHORA)
  const postulaciones = new RepositorioDePostulacionesFake()
  const periodos = new RepositorioDePeriodosFake(postulaciones)
  const cargas = new RegistroDeCargasFake(reloj)
  const pagos = new RegistroDePagosFake(postulaciones, periodos, cargas, reloj)

  await periodos.guardar(
    new PeriodoDeIngreso('periodo-1', INSTITUCION, 'Período', 10, new Date('2026-12-01'), 3, 1_500_000),
  )
  const carga = await cargas.iniciar(INSTITUCION, 'TESORERIA-1', 'informe.csv')
  const enRevision = postulaciones.sembrar({
    aspiranteId: 'a-1',
    periodoId: 'periodo-1',
    estado: 'VENCIDO',
    venceEl: new Date('2026-10-10'),
  })

  const informado = (referencia: string) => ({
    referencia: new ReferenciaDePago('INFORME_SYSADMIN', referencia),
    monto: new Monto(1_500_000),
    pagadoEl: AHORA,
  })
  await pagos.registrarAcreditacion(
    informado('r-no-imputado'),
    { tipo: 'NO_IMPUTAR', motivo: 'REFERENCIA_DESCONOCIDA' },
    carga.id,
  )
  await pagos.registrarAcreditacion(
    informado('r-a-decidir'),
    { tipo: 'REVISION', postulacionId: enRevision.id, estadoEsperado: 'VENCIDO', motivo: 'FUERA_DE_PLAZO' },
    carga.id,
  )

  return {
    bandeja: new ListarBandejaUseCase(pagos),
    listarCargas: new ListarCargasDeInformeUseCase(cargas),
  }
}

describe('ListarBandeja', () => {
  it('Tesorería y Secretaría ven los no imputados', async () => {
    const { bandeja } = await armarMundo()

    for (const rol of ['TESORERIA', 'SECRETARIA'] as const) {
      const pagos = await bandeja.ejecutar(actor(rol), 'NO_IMPUTADO')
      expect(pagos.map((p) => p.referencia.referenciaExterna)).toEqual(['r-no-imputado'])
    }
  })

  it('Tesorería y Secretaría ven los devueltos', async () => {
    const { bandeja } = await armarMundo()

    expect(await bandeja.ejecutar(actor('TESORERIA'), 'DEVUELTO')).toEqual([])
    expect(await bandeja.ejecutar(actor('SECRETARIA'), 'DEVUELTO')).toEqual([])
  })

  it('A_DECIDIR es solo para Dirección', async () => {
    const { bandeja } = await armarMundo()

    const pagos = await bandeja.ejecutar(actor('DIRECCION'), 'A_DECIDIR')
    expect(pagos.map((p) => p.referencia.referenciaExterna)).toEqual(['r-a-decidir'])

    await expect(bandeja.ejecutar(actor('TESORERIA'), 'A_DECIDIR')).rejects.toThrow(NoAutorizado)
    await expect(bandeja.ejecutar(actor('SECRETARIA'), 'A_DECIDIR')).rejects.toThrow(NoAutorizado)
  })

  it('el aspirante no ve ninguna bandeja', async () => {
    const { bandeja } = await armarMundo()

    await expect(bandeja.ejecutar(actor('ASPIRANTE'), 'NO_IMPUTADO')).rejects.toThrow(NoAutorizado)
    await expect(bandeja.ejecutar(actor('DIRECCION'), 'NO_IMPUTADO')).rejects.toThrow(NoAutorizado)
  })
})

describe('ListarCargasDeInforme', () => {
  it('el personal ve las cargas de su institución', async () => {
    const { listarCargas } = await armarMundo()

    for (const rol of ['TESORERIA', 'SECRETARIA', 'DIRECCION'] as const) {
      const cargas = await listarCargas.ejecutar(actor(rol))
      expect(cargas.map((c) => c.nombreArchivo)).toEqual(['informe.csv'])
    }
  })

  it('el aspirante no ve las cargas', async () => {
    const { listarCargas } = await armarMundo()

    await expect(listarCargas.ejecutar(actor('ASPIRANTE'))).rejects.toThrow(NoAutorizado)
  })
})
