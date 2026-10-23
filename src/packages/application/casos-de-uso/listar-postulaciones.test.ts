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

    expect(todas.items.map((p) => p.numero)).toEqual(['000001', '000002', '000003'])
    expect(todas.items.map((p) => p.estado)).toEqual([
      'PREINSCRIPTO',
      'VACANTE_CONFIRMADA',
      'PAGO_EN_REVISION',
    ])
  })

  it('también lo puede hacer TESORERIA y DIRECCION', async () => {
    const { caso } = armar()

    await expect(caso.ejecutar({ ...secretaria, rol: 'TESORERIA' })).resolves.toMatchObject({
      items: [],
      total: 0,
    })
    await expect(caso.ejecutar({ ...secretaria, rol: 'DIRECCION' })).resolves.toMatchObject({
      items: [],
      total: 0,
    })
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

    expect(suyas.items).toHaveLength(1)
    expect(suyas.items[0]?.numero).toBe('000002')
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

    expect((await caso.ejecutar(secretaria, { periodoId: 'periodo-1' })).items).toHaveLength(2)
    expect((await caso.ejecutar(secretaria, { estado: 'PREINSCRIPTO' })).items).toHaveLength(2)
  })

  it('pagina y devuelve el total de coincidencias', async () => {
    const { caso, postulaciones } = armar()
    for (let i = 1; i <= 5; i += 1) {
      postulaciones.sembrar({
        aspiranteId: `aspirante-${i}`,
        periodoId: 'periodo-1',
        estado: 'PREINSCRIPTO',
      })
    }

    const primera = await caso.ejecutar(secretaria, {}, { pagina: 1, porPagina: 2 })
    const tercera = await caso.ejecutar(secretaria, {}, { pagina: 3, porPagina: 2 })

    expect(primera.items).toHaveLength(2)
    expect(primera.total).toBe(5)
    expect(primera.totalPaginas).toBe(3)
    expect(tercera.items).toHaveLength(1)
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

    expect(todas.items[0]?.estado).toBe('VENCIDO')
    expect(todas.items[0]?.aviso).toBeNull()
  })

  it('devuelve una lista vacía si no hay coincidencias', async () => {
    const { caso } = armar()

    expect((await caso.ejecutar(secretaria, { aspiranteId: 'no-existe' })).items).toEqual([])
  })

  it('no lo puede hacer un ASPIRANTE', async () => {
    const { caso } = armar()

    await expect(caso.ejecutar(aspirante)).rejects.toThrow(NoAutorizado)
  })
})
