import { describe, expect, it } from 'vitest'
import { RelojFijo } from '../puertos/reloj/fake'
import { RepositorioDePostulacionesFake } from '../puertos/repositorio-de-postulaciones/fake'
import type { Actor } from './actor'
import { NoAutorizado } from './errores'
import { ListarPostulacionesUseCase } from './listar-postulaciones'

const AHORA = new Date('2026-10-20T00:00:00.000Z')
const UN_DIA = 24 * 60 * 60 * 1000

const secretaria: Actor = {
  perfilId: 'secretaria-1',
  rol: 'SECRETARIA',
  institucionId: 'institucion-1',
}

const aspirante: Actor = {
  perfilId: 'aspirante-1',
  rol: 'ASPIRANTE',
  institucionId: 'institucion-1',
}

function armar() {
  const reloj = new RelojFijo(AHORA)
  const postulaciones = new RepositorioDePostulacionesFake()

  return {
    caso: new ListarPostulacionesUseCase(postulaciones, reloj),
    postulaciones,
  }
}

describe('ListarPostulaciones', () => {
  it('lista todas las Postulaciones para el personal, ordenadas por número', async () => {
    const { caso, postulaciones } = armar()
    postulaciones.sembrar({
      aspiranteId: 'aspirante-1',
      periodoId: 'periodo-1',
      estado: 'PREINSCRIPTO',
    })
    postulaciones.sembrar({
      aspiranteId: 'aspirante-2',
      periodoId: 'periodo-1',
      estado: 'VACANTE_CONFIRMADA',
    })
    postulaciones.sembrar({
      aspiranteId: 'aspirante-3',
      periodoId: 'periodo-2',
      estado: 'PAGO_EN_REVISION',
      motivoRevision: 'SIN_CUPO',
    })

    const todas = await caso.ejecutar(secretaria)

    expect(todas.map((p) => p.numero)).toEqual(['000001', '000002', '000003'])
    expect(todas.map((p) => p.estado)).toEqual([
      'PREINSCRIPTO',
      'VACANTE_CONFIRMADA',
      'PAGO_EN_REVISION',
    ])
  })

  it('también lo puede hacer TESORERIA y DIRECCION', async () => {
    const { caso } = armar()

    await expect(caso.ejecutar({ ...secretaria, rol: 'TESORERIA' })).resolves.toEqual([])
    await expect(caso.ejecutar({ ...secretaria, rol: 'DIRECCION' })).resolves.toEqual([])
  })

  it('filtra por el id de perfil del aspirante', async () => {
    const { caso, postulaciones } = armar()
    postulaciones.sembrar({
      aspiranteId: 'aspirante-1',
      periodoId: 'periodo-1',
      estado: 'PREINSCRIPTO',
    })
    postulaciones.sembrar({
      aspiranteId: 'aspirante-2',
      periodoId: 'periodo-1',
      estado: 'PREINSCRIPTO',
    })

    const suyas = await caso.ejecutar(secretaria, { aspiranteId: 'aspirante-2' })

    expect(suyas).toHaveLength(1)
    expect(suyas[0]?.numero).toBe('000002')
  })

  it('filtra por período y por estado persistido', async () => {
    const { caso, postulaciones } = armar()
    postulaciones.sembrar({
      aspiranteId: 'aspirante-1',
      periodoId: 'periodo-1',
      estado: 'PREINSCRIPTO',
    })
    postulaciones.sembrar({
      aspiranteId: 'aspirante-2',
      periodoId: 'periodo-1',
      estado: 'VACANTE_CONFIRMADA',
    })
    postulaciones.sembrar({
      aspiranteId: 'aspirante-3',
      periodoId: 'periodo-2',
      estado: 'PREINSCRIPTO',
    })

    expect(await caso.ejecutar(secretaria, { periodoId: 'periodo-1' })).toHaveLength(2)
    expect(await caso.ejecutar(secretaria, { estado: 'PREINSCRIPTO' })).toHaveLength(2)
  })

  it('informa el estado efectivo: una pendiente vencida se lista VENCIDA', async () => {
    const { caso, postulaciones } = armar()
    postulaciones.sembrar({
      aspiranteId: 'aspirante-1',
      periodoId: 'periodo-1',
      estado: 'PAGO_PENDIENTE',
      venceEl: new Date(AHORA.getTime() - UN_DIA),
    })

    const todas = await caso.ejecutar(secretaria)

    expect(todas[0]?.estado).toBe('VENCIDO')
    expect(todas[0]?.aviso).toBeNull()
  })

  it('devuelve una lista vacía si no hay coincidencias', async () => {
    const { caso } = armar()

    expect(await caso.ejecutar(secretaria, { aspiranteId: 'no-existe' })).toEqual([])
  })

  it('no lo puede hacer un ASPIRANTE', async () => {
    const { caso } = armar()

    await expect(caso.ejecutar(aspirante)).rejects.toThrow(NoAutorizado)
  })
})
