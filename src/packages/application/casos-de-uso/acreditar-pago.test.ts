import { describe, expect, it } from 'vitest'
import {
  Dni,
  Monto,
  NumeroDePostulacion,
  Perfil,
  PeriodoDeIngreso,
  ReferenciaDePago,
  type Pago,
  type PagoInformado,
  type ProveedorDePago,
} from '@tfi/domain'
import { RegistroDeCargasFake } from '../puertos/registro-de-cargas/fake'
import { RegistroDePagosFake } from '../puertos/registro-de-pagos/fake'
import type { RegistroDePagos } from '../puertos/registro-de-pagos/puerto'
import { RelojFijo } from '../puertos/reloj/fake'
import { RepositorioDePerfilesFake } from '../puertos/repositorio-de-perfiles/fake'
import { RepositorioDePeriodosFake } from '../puertos/repositorio-de-periodos/fake'
import { RepositorioDePostulacionesFake } from '../puertos/repositorio-de-postulaciones/fake'
import { AcreditarPagoUseCase, type ResultadoDeAcreditacionDePago } from './acreditar-pago'
import type { Actor } from './actor'
import { ConflictoDeEstado, NoAutorizado } from './errores'

const AHORA = new Date('2026-10-20T12:00:00.000Z')
const UN_DIA = 24 * 60 * 60 * 1000
const INSTITUCION = 'institucion-1'
const MATRICULA = 1_500_000

const tesoreria: Actor = { perfilId: 'tesoreria-1', rol: 'TESORERIA', institucionId: INSTITUCION }

let referencias = 0

function pago(
  datos: { dni?: string; numero?: number; pagadoEl?: Date; centavos?: number; proveedor?: ProveedorDePago } = {},
): PagoInformado {
  referencias += 1
  return {
    referencia: new ReferenciaDePago(datos.proveedor ?? 'INFORME_SYSADMIN', `ref-${referencias}`),
    monto: new Monto(datos.centavos ?? MATRICULA),
    pagadoEl: datos.pagadoEl ?? AHORA,
    dni: datos.dni !== undefined ? new Dni(datos.dni) : undefined,
    numero: datos.numero !== undefined ? NumeroDePostulacion.desde(datos.numero) : undefined,
  }
}

/** El pago que quedó registrado: una fila ignorada no registra ninguno. */
function registrado(resultado: ResultadoDeAcreditacionDePago): Pago {
  if (resultado.resultado === 'IGNORADO') throw new Error(`La fila se ignoró: ${resultado.motivo}`)
  return resultado.pago
}

function perfilDeAspirante(id: string, dni: string): Perfil {
  return new Perfil(
    id,
    `${id}@local.test`,
    'Ana',
    'Prueba',
    dni,
    `27${dni}4`,
    new Date('2000-01-01'),
    'F',
    null,
    null,
    'ASPIRANTE',
    INSTITUCION,
    true,
    AHORA,
    AHORA,
  )
}

async function armarMundo(opciones: { totalCupos?: number; registro?: (real: RegistroDePagos) => RegistroDePagos } = {}) {
  const reloj = new RelojFijo(AHORA)
  const postulaciones = new RepositorioDePostulacionesFake()
  const periodos = new RepositorioDePeriodosFake(postulaciones)
  const perfiles = new RepositorioDePerfilesFake()
  const cargas = new RegistroDeCargasFake(reloj)
  const real = new RegistroDePagosFake(postulaciones, periodos, cargas, reloj)
  const registro = opciones.registro ? opciones.registro(real) : real

  const periodo = new PeriodoDeIngreso(
    'periodo-1',
    INSTITUCION,
    'Primer cuatrimestre',
    opciones.totalCupos ?? 10,
    new Date(AHORA.getTime() + 30 * UN_DIA),
    3,
    MATRICULA,
  )
  await periodos.guardar(periodo)

  let aspirantes = 0
  const sembrar = (dni: string, estado: 'PAGO_PENDIENTE' | 'VENCIDO' | 'VACANTE_CONFIRMADA' = 'PAGO_PENDIENTE', venceEl?: Date) => {
    aspirantes += 1
    const aspiranteId = `aspirante-${aspirantes}`
    perfiles.agregar(perfilDeAspirante(aspiranteId, dni))
    return postulaciones.sembrar({
      aspiranteId,
      periodoId: periodo.id,
      estado,
      dni,
      venceEl: venceEl ?? (estado === 'VACANTE_CONFIRMADA' ? null : new Date(AHORA.getTime() + 2 * UN_DIA)),
    })
  }

  return {
    caso: new AcreditarPagoUseCase(postulaciones, periodos, perfiles, registro),
    postulaciones,
    sembrar,
    registro: real,
    estadoDe: async (id: string) => (await postulaciones.obtenerPorId(id))?.estado,
  }
}

describe('AcreditarPago', () => {
  it('acredita por número con el DNI que coincide y confirma la vacante', async () => {
    const { caso, sembrar, estadoDe } = await armarMundo()
    const postulacion = sembrar('30111222')

    const resultado = await caso.ejecutar(tesoreria, pago({ numero: postulacion.numero.valor, dni: '30111222' }))

    expect(resultado.resultado).toBe('ACREDITADO')
    expect(registrado(resultado).postulacionId).toBe(postulacion.id)
    expect(await estadoDe(postulacion.id)).toBe('VACANTE_CONFIRMADA')
  })

  it('acredita por DNI cuando el informe no trae número', async () => {
    const { caso, sembrar, estadoDe } = await armarMundo()
    const postulacion = sembrar('30111222')

    const resultado = await caso.ejecutar(tesoreria, pago({ dni: '30111222' }))

    expect(resultado.resultado).toBe('ACREDITADO')
    expect(await estadoDe(postulacion.id)).toBe('VACANTE_CONFIRMADA')
  })

  it('la misma referencia dos veces da DUPLICADO', async () => {
    const { caso, sembrar } = await armarMundo()
    sembrar('30111222')
    const informado = pago({ dni: '30111222' })

    await caso.ejecutar(tesoreria, informado)
    const segunda = await caso.ejecutar(tesoreria, informado)

    expect(segunda.resultado).toBe('DUPLICADO')
  })

  it('por número con un DNI que no coincide no imputa el pago', async () => {
    const { caso, sembrar, estadoDe } = await armarMundo()
    const postulacion = sembrar('30111222')

    const resultado = await caso.ejecutar(tesoreria, pago({ numero: postulacion.numero.valor, dni: '40999888' }))

    expect(resultado.resultado).toBe('NO_IMPUTADO')
    expect(registrado(resultado).motivoNoImputado).toBe('DNI_NO_COINCIDE')
    expect(await estadoDe(postulacion.id)).toBe('PAGO_PENDIENTE')
  })

  it('si el número no existe, busca por el DNI', async () => {
    const { caso, sembrar } = await armarMundo()
    sembrar('30111222')

    const resultado = await caso.ejecutar(tesoreria, pago({ numero: 999_999, dni: '30111222' }))

    expect(resultado.resultado).toBe('ACREDITADO')
  })

  it('sin ninguna Postulación que coincida queda como referencia desconocida', async () => {
    const { caso } = await armarMundo()

    const resultado = await caso.ejecutar(tesoreria, pago({ dni: '30111222', proveedor: 'MANUAL' }))

    expect(resultado.resultado).toBe('NO_IMPUTADO')
    expect(registrado(resultado).motivoNoImputado).toBe('REFERENCIA_DESCONOCIDA')
  })

  it('un DNI con dos Postulaciones pendientes es ambiguo', async () => {
    const reloj = new RelojFijo(AHORA)
    const postulaciones = new RepositorioDePostulacionesFake()
    const periodos = new RepositorioDePeriodosFake(postulaciones)
    const registro = new RegistroDePagosFake(postulaciones, periodos, new RegistroDeCargasFake(reloj), reloj)
    for (const id of ['periodo-a', 'periodo-b']) {
      await periodos.guardar(
        new PeriodoDeIngreso(id, INSTITUCION, id, 10, new Date(AHORA.getTime() + 30 * UN_DIA), 3, MATRICULA),
      )
      postulaciones.sembrar({ aspiranteId: 'aspirante-1', periodoId: id, estado: 'PAGO_PENDIENTE', dni: '30111222' })
    }
    const caso = new AcreditarPagoUseCase(postulaciones, periodos, new RepositorioDePerfilesFake(), registro)

    const resultado = await caso.ejecutar(tesoreria, pago({ dni: '30111222' }))

    expect(resultado.resultado).toBe('NO_IMPUTADO')
    expect(registrado(resultado).motivoNoImputado).toBe('AMBIGUA')
  })

  it('un pago con fecha posterior al vencimiento pasa a revisión de Dirección', async () => {
    const { caso, sembrar, estadoDe } = await armarMundo()
    const venceEl = new Date(AHORA.getTime() - UN_DIA)
    const postulacion = sembrar('30111222', 'VENCIDO', venceEl)

    const resultado = await caso.ejecutar(tesoreria, pago({ dni: '30111222', pagadoEl: AHORA }))

    expect(resultado.resultado).toBe('A_DECIDIR')
    expect(registrado(resultado).motivoRevision).toBe('FUERA_DE_PLAZO')
    expect(await estadoDe(postulacion.id)).toBe('PAGO_EN_REVISION')
  })

  it('si ya tiene la vacante (por ejemplo, acreditada a mano) es un pago doble', async () => {
    const { caso, sembrar } = await armarMundo()
    sembrar('30111222', 'VACANTE_CONFIRMADA')

    const resultado = await caso.ejecutar(tesoreria, pago({ dni: '30111222', proveedor: 'MANUAL' }))

    expect(resultado.resultado).toBe('NO_IMPUTADO')
    expect(registrado(resultado).motivoNoImputado).toBe('YA_TIENE_PAGO')
  })

  describe('filas del informe de SysAdmin que no son de la admisión (ADR 0011)', () => {
    it('un DNI sin Postulaciones se ignora y no se registra ningún pago', async () => {
      const { caso, registro } = await armarMundo()
      const informado = pago({ dni: '30111222' })

      const resultado = await caso.ejecutar(tesoreria, informado)

      expect(resultado).toEqual({ resultado: 'IGNORADO', motivo: 'SIN_POSTULACION' })
      expect(await registro.existe(informado.referencia)).toBeNull()
    })

    it('una fila sin DNI se ignora', async () => {
      const { caso } = await armarMundo()

      const resultado = await caso.ejecutar(tesoreria, pago())

      expect(resultado).toEqual({ resultado: 'IGNORADO', motivo: 'SIN_POSTULACION' })
    })

    it('un DNI con todas sus Postulaciones admitidas se ignora (las cuotas de quien ya cursa)', async () => {
      const { caso, sembrar } = await armarMundo()
      sembrar('30111222', 'VACANTE_CONFIRMADA')

      const resultado = await caso.ejecutar(tesoreria, pago({ dni: '30111222' }))

      expect(resultado).toEqual({ resultado: 'IGNORADO', motivo: 'YA_ADMITIDO' })
    })

    it('un DNI admitido en un período y con el pago pendiente en otro se acredita', async () => {
      const reloj = new RelojFijo(AHORA)
      const postulaciones = new RepositorioDePostulacionesFake()
      const periodos = new RepositorioDePeriodosFake(postulaciones)
      const registro = new RegistroDePagosFake(postulaciones, periodos, new RegistroDeCargasFake(reloj), reloj)
      for (const id of ['periodo-a', 'periodo-b']) {
        await periodos.guardar(
          new PeriodoDeIngreso(id, INSTITUCION, id, 10, new Date(AHORA.getTime() + 30 * UN_DIA), 3, MATRICULA),
        )
      }
      postulaciones.sembrar({ aspiranteId: 'aspirante-1', periodoId: 'periodo-a', estado: 'VACANTE_CONFIRMADA', dni: '30111222' })
      const pendiente = postulaciones.sembrar({
        aspiranteId: 'aspirante-1',
        periodoId: 'periodo-b',
        estado: 'PAGO_PENDIENTE',
        dni: '30111222',
        venceEl: new Date(AHORA.getTime() + UN_DIA),
      })
      const caso = new AcreditarPagoUseCase(postulaciones, periodos, new RepositorioDePerfilesFake(), registro)

      const resultado = await caso.ejecutar(tesoreria, pago({ dni: '30111222' }))

      expect(resultado.resultado).toBe('ACREDITADO')
      expect((await postulaciones.obtenerPorId(pendiente.id))?.estado).toBe('VACANTE_CONFIRMADA')
    })

    it('un pago que trae un número existente no se ignora', async () => {
      const { caso, sembrar } = await armarMundo()
      const admitida = sembrar('30111222', 'VACANTE_CONFIRMADA')

      const resultado = await caso.ejecutar(tesoreria, pago({ numero: admitida.numero.valor, dni: '30111222' }))

      expect(resultado.resultado).toBe('NO_IMPUTADO')
      expect(registrado(resultado).motivoNoImputado).toBe('YA_TIENE_PAGO')
    })

    it('reimportar una seña ya acreditada da DUPLICADO, no YA_ADMITIDO', async () => {
      const { caso, sembrar } = await armarMundo()
      sembrar('30111222')
      const informado = pago({ dni: '30111222' })

      await caso.ejecutar(tesoreria, informado)
      const segunda = await caso.ejecutar(tesoreria, informado)

      expect(segunda.resultado).toBe('DUPLICADO')
    })
  })

  it('ante un conflicto relee y vuelve a decidir: si se ocupó el último cupo, va a revisión SIN_CUPO', async () => {
    let otro: (() => void) | undefined
    const mundo = await armarMundo({
      totalCupos: 1,
      registro: (real) => ({
        existe: (referencia) => real.existe(referencia),
        listarPorEstado: (institucion, estado) => real.listarPorEstado(institucion, estado),
        registrarDecision: (...args) => real.registrarDecision(...args),
        registrarAcreditacion: async (informado, decision, cargaId) => {
          // Justo antes de escribir, otro aspirante se queda con el último cupo.
          otro?.()
          otro = undefined
          return real.registrarAcreditacion(informado, decision, cargaId)
        },
      }),
    })
    const postulacion = mundo.sembrar('30111222')
    otro = () => mundo.sembrar('40999888', 'VACANTE_CONFIRMADA')

    const resultado = await mundo.caso.ejecutar(tesoreria, pago({ dni: '30111222' }))

    expect(resultado.resultado).toBe('A_DECIDIR')
    expect(registrado(resultado).motivoRevision).toBe('SIN_CUPO')
    expect(await mundo.estadoDe(postulacion.id)).toBe('PAGO_EN_REVISION')
  })

  it('después de 3 conflictos seguidos falla para que la fila se reprocese', async () => {
    let intentos = 0
    const { caso, sembrar } = await armarMundo({
      registro: (real) => ({
        existe: (referencia) => real.existe(referencia),
        listarPorEstado: (institucion, estado) => real.listarPorEstado(institucion, estado),
        registrarDecision: (...args) => real.registrarDecision(...args),
        registrarAcreditacion: async () => {
          intentos += 1
          return { tipo: 'CONFLICTO' }
        },
      }),
    })
    sembrar('30111222')

    await expect(caso.ejecutar(tesoreria, pago({ dni: '30111222' }))).rejects.toThrow(ConflictoDeEstado)
    expect(intentos).toBe(3)
  })

  it('solo Tesorería puede acreditar', async () => {
    const { caso } = await armarMundo()

    for (const rol of ['SECRETARIA', 'DIRECCION', 'ASPIRANTE'] as const) {
      await expect(
        caso.ejecutar({ perfilId: 'x', rol, institucionId: INSTITUCION }, pago({ dni: '30111222' })),
      ).rejects.toThrow(NoAutorizado)
    }
  })
})
