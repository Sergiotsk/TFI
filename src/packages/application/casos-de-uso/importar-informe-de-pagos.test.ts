import { describe, expect, it } from 'vitest'
import { Dni, Monto, PeriodoDeIngreso, ReferenciaDePago, type PagoInformado } from '@tfi/domain'
import { RegistroDeCargasFake } from '../puertos/registro-de-cargas/fake'
import { RegistroDePagosFake } from '../puertos/registro-de-pagos/fake'
import type { RegistroDePagos } from '../puertos/registro-de-pagos/puerto'
import { RelojFijo } from '../puertos/reloj/fake'
import { RepositorioDePerfilesFake } from '../puertos/repositorio-de-perfiles/fake'
import { RepositorioDePeriodosFake } from '../puertos/repositorio-de-periodos/fake'
import { RepositorioDePostulacionesFake } from '../puertos/repositorio-de-postulaciones/fake'
import { AcreditarPagoUseCase } from './acreditar-pago'
import type { Actor } from './actor'
import { NoAutorizado, SolicitudInvalida } from './errores'
import { ImportarInformeDePagosUseCase } from './importar-informe-de-pagos'

const AHORA = new Date('2026-10-20T12:00:00.000Z')
const UN_DIA = 24 * 60 * 60 * 1000
const INSTITUCION = 'institucion-1'
const MATRICULA = 1_500_000

const tesoreria: Actor = { perfilId: 'tesoreria-1', rol: 'TESORERIA', institucionId: INSTITUCION }

function pago(referencia: string, dni: string, pagadoEl = AHORA): PagoInformado {
  return {
    referencia: new ReferenciaDePago('INFORME_SYSADMIN', referencia),
    monto: new Monto(MATRICULA),
    pagadoEl,
    dni: new Dni(dni),
  }
}

async function armarMundo(envolver?: (real: RegistroDePagos) => RegistroDePagos) {
  const reloj = new RelojFijo(AHORA)
  const postulaciones = new RepositorioDePostulacionesFake()
  const periodos = new RepositorioDePeriodosFake(postulaciones)
  const cargas = new RegistroDeCargasFake(reloj)
  const real = new RegistroDePagosFake(postulaciones, periodos, cargas, reloj)
  const pagos = envolver ? envolver(real) : real
  const acreditar = new AcreditarPagoUseCase(postulaciones, periodos, new RepositorioDePerfilesFake(), pagos)

  await periodos.guardar(
    new PeriodoDeIngreso('periodo-1', INSTITUCION, 'Período', 10, new Date(AHORA.getTime() + 30 * UN_DIA), 3, MATRICULA),
  )
  const sembrar = (aspiranteId: string, dni: string, venceEl = new Date(AHORA.getTime() + UN_DIA)) =>
    postulaciones.sembrar({ aspiranteId, periodoId: 'periodo-1', estado: 'PAGO_PENDIENTE', dni, venceEl })

  return { caso: new ImportarInformeDePagosUseCase(cargas, acreditar), cargas, pagos: real, sembrar }
}

describe('ImportarInformeDePagos', () => {
  it('acredita cada fila, cierra la carga y resume por categoría', async () => {
    const { caso, cargas, sembrar } = await armarMundo()
    sembrar('a-1', '30111001')
    sembrar('a-2', '30111002', new Date(AHORA.getTime() - UN_DIA))

    const resultado = await caso.ejecutar(tesoreria, 'informe-20-10.csv', [
      pago('r-1', '30111001'),
      pago('r-2', '30111002'),
      pago('r-3', '30999999'),
    ])

    expect(resultado.resumen).toEqual({ acreditados: 1, aDecidir: 1, noImputados: 1, duplicados: 0 })
    expect(resultado.filas.map((f) => f.resultado)).toEqual(['ACREDITADO', 'A_DECIDIR', 'NO_IMPUTADO'])
    expect(resultado.filas[2]?.motivo).toBe('REFERENCIA_DESCONOCIDA')

    const [guardada] = await cargas.listar(INSTITUCION)
    expect(guardada?.nombreArchivo).toBe('informe-20-10.csv')
    expect(guardada?.resumen).toEqual(resultado.resumen)
  })

  it('los pagos quedan asociados a la carga', async () => {
    const { caso, pagos, sembrar } = await armarMundo()
    sembrar('a-1', '30111001')

    const resultado = await caso.ejecutar(tesoreria, 'informe.csv', [pago('r-1', '30111001')])

    const guardado = await pagos.existe(new ReferenciaDePago('INFORME_SYSADMIN', 'r-1'))
    expect(guardado?.cargaId).toBe(resultado.carga.id)
  })

  it('reimportar el mismo informe da todo duplicado y no cambia nada (SC-002)', async () => {
    const { caso, sembrar } = await armarMundo()
    sembrar('a-1', '30111001')
    const filas = [pago('r-1', '30111001'), pago('r-2', '30999999')]

    await caso.ejecutar(tesoreria, 'informe.csv', filas)
    const segunda = await caso.ejecutar(tesoreria, 'informe.csv', filas)

    expect(segunda.resumen).toEqual({ acreditados: 0, aDecidir: 0, noImputados: 0, duplicados: 2 })
  })

  it('una fila que falla se marca para reprocesar y no corta el resto', async () => {
    const { caso, sembrar } = await armarMundo((real) => ({
      existe: (referencia) => real.existe(referencia),
      listarPorEstado: (institucion, estado) => real.listarPorEstado(institucion, estado),
      registrarAcreditacion: async (informado, decision, cargaId) =>
        informado.referencia.referenciaExterna === 'r-1'
          ? { tipo: 'CONFLICTO' }
          : real.registrarAcreditacion(informado, decision, cargaId),
    }))
    sembrar('a-1', '30111001')
    sembrar('a-2', '30111002')

    const resultado = await caso.ejecutar(tesoreria, 'informe.csv', [
      pago('r-1', '30111001'),
      pago('r-2', '30111002'),
    ])

    expect(resultado.filas.map((f) => f.resultado)).toEqual(['ERROR', 'ACREDITADO'])
    expect(resultado.conError).toBe(1)
    expect(resultado.resumen.acreditados).toBe(1)
  })

  it('un informe sin pagos se rechaza', async () => {
    const { caso } = await armarMundo()

    await expect(caso.ejecutar(tesoreria, 'vacio.csv', [])).rejects.toThrow(SolicitudInvalida)
  })

  it('solo Tesorería puede importar', async () => {
    const { caso } = await armarMundo()

    await expect(
      caso.ejecutar({ ...tesoreria, rol: 'SECRETARIA' }, 'informe.csv', [pago('r-1', '30111001')]),
    ).rejects.toThrow(NoAutorizado)
  })
})
