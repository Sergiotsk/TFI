import { describe, expect, it } from 'vitest'
import { RelojFijo } from '../puertos/reloj/fake'
import { RepositorioDePostulacionesFake } from '../puertos/repositorio-de-postulaciones/fake'
import type { Actor } from './actor'
import { ConsultarPostulacionUseCase } from './consultar-postulacion'
import { NoAutorizado } from './errores'

const AHORA = new Date('2026-10-20T00:00:00.000Z')
const UN_DIA = 24 * 60 * 60 * 1000

const aspirante: Actor = {
  perfilId: 'aspirante-1',
  rol: 'ASPIRANTE',
  institucionId: 'institucion-1',
}

const secretaria: Actor = {
  perfilId: 'secretaria-1',
  rol: 'SECRETARIA',
  institucionId: 'institucion-1',
}

function armar() {
  const reloj = new RelojFijo(AHORA)
  const postulaciones = new RepositorioDePostulacionesFake()

  return {
    caso: new ConsultarPostulacionUseCase(postulaciones, reloj),
    postulaciones,
  }
}

describe('ConsultarPostulacion', () => {
  it('devuelve null si la Postulación no existe', async () => {
    const { caso } = armar()

    expect(await caso.ejecutar(aspirante, 'no-existe')).toBeNull()
  })

  it('informa el estado efectivo: una pendiente vencida se ve VENCIDA', async () => {
    const { caso, postulaciones } = armar()
    const vencida = postulaciones.sembrar({
      aspiranteId: aspirante.perfilId,
      periodoId: 'periodo-1',
      estado: 'PAGO_PENDIENTE',
      venceEl: new Date(AHORA.getTime() - UN_DIA),
    })

    const vista = await caso.ejecutar(aspirante, vencida.id)

    expect(vista?.estado).toBe('VENCIDO')
    expect(vista?.aviso).toBeNull()
  })

  it('avisa que el lugar no está reservado en PAGO_PENDIENTE (FR-007)', async () => {
    const { caso, postulaciones } = armar()
    const pendiente = postulaciones.sembrar({
      aspiranteId: aspirante.perfilId,
      periodoId: 'periodo-1',
      estado: 'PAGO_PENDIENTE',
      venceEl: new Date(AHORA.getTime() + UN_DIA),
    })

    const vista = await caso.ejecutar(aspirante, pendiente.id)

    expect(vista?.estado).toBe('PAGO_PENDIENTE')
    expect(vista?.aviso).toBe('Tu lugar no está reservado hasta que se acredite el pago.')
  })

  it('avisa que el pago está en revisión en PAGO_EN_REVISION', async () => {
    const { caso, postulaciones } = armar()
    const enRevision = postulaciones.sembrar({
      aspiranteId: aspirante.perfilId,
      periodoId: 'periodo-1',
      estado: 'PAGO_EN_REVISION',
      motivoRevision: 'FUERA_DE_PLAZO',
    })

    const vista = await caso.ejecutar(aspirante, enRevision.id)

    expect(vista?.aviso).toBe('Tu pago está en revisión.')
    expect(vista?.motivoRevision).toBe('FUERA_DE_PLAZO')
  })

  it('devuelve el número formateado con seis dígitos', async () => {
    const { caso, postulaciones } = armar()
    const creada = await postulaciones.crear(aspirante.perfilId, 'periodo-1')

    const vista = await caso.ejecutar(aspirante, creada.id)

    expect(vista?.numero).toBe('000001')
  })

  it('el personal puede ver cualquier Postulación', async () => {
    const { caso, postulaciones } = armar()
    const ajena = postulaciones.sembrar({
      aspiranteId: 'otro-aspirante',
      periodoId: 'periodo-1',
      estado: 'PREINSCRIPTO',
    })

    const vista = await caso.ejecutar(secretaria, ajena.id)

    expect(vista?.id).toBe(ajena.id)
  })

  it('otro aspirante no puede ver una Postulación ajena', async () => {
    const { caso, postulaciones } = armar()
    const ajena = postulaciones.sembrar({
      aspiranteId: 'otro-aspirante',
      periodoId: 'periodo-1',
      estado: 'PREINSCRIPTO',
    })

    await expect(caso.ejecutar(aspirante, ajena.id)).rejects.toThrow(NoAutorizado)
  })

  it('listarMias() devuelve solo las propias, con el estado efectivo', async () => {
    const { caso, postulaciones } = armar()
    postulaciones.sembrar({
      aspiranteId: aspirante.perfilId,
      periodoId: 'periodo-1',
      estado: 'PAGO_PENDIENTE',
      venceEl: new Date(AHORA.getTime() - UN_DIA),
    })
    postulaciones.sembrar({
      aspiranteId: 'otro-aspirante',
      periodoId: 'periodo-1',
      estado: 'PREINSCRIPTO',
    })

    const mias = await caso.listarMias(aspirante)

    expect(mias).toHaveLength(1)
    expect(mias[0]?.estado).toBe('VENCIDO')
  })

  it('listarMias() es solo para ASPIRANTE', async () => {
    const { caso } = armar()

    await expect(caso.listarMias(secretaria)).rejects.toThrow(NoAutorizado)
  })
})
