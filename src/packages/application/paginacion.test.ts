import { describe, expect, it } from 'vitest'
import {
  MAXIMO_POR_PAGINA,
  armarPagina,
  normalizarPaginacion,
  rangoDe,
} from './paginacion'

describe('paginación', () => {
  it('usa la primera página y el tamaño por defecto cuando no se pide nada', () => {
    expect(normalizarPaginacion()).toEqual({ pagina: 1, porPagina: 20 })
  })

  it('respeta una página y un tamaño válidos', () => {
    expect(normalizarPaginacion({ pagina: 3, porPagina: 15 })).toEqual({
      pagina: 3,
      porPagina: 15,
    })
  })

  it('cae en la primera página con valores inválidos o negativos', () => {
    expect(normalizarPaginacion({ pagina: 0, porPagina: 10 }).pagina).toBe(1)
    expect(normalizarPaginacion({ pagina: -2, porPagina: 10 }).pagina).toBe(1)
    expect(normalizarPaginacion({ pagina: 1.5, porPagina: 10 }).pagina).toBe(1)
  })

  it('limita el tamaño de página al máximo', () => {
    expect(normalizarPaginacion({ pagina: 1, porPagina: 500 }).porPagina).toBe(
      MAXIMO_POR_PAGINA,
    )
  })

  it('calcula el rango inclusivo que espera Supabase', () => {
    expect(rangoDe({ pagina: 1, porPagina: 20 })).toEqual({ desde: 0, hasta: 19 })
    expect(rangoDe({ pagina: 3, porPagina: 10 })).toEqual({ desde: 20, hasta: 29 })
  })

  it('arma el sobre con el total y la cantidad de páginas', () => {
    expect(armarPagina(['a', 'b'], 25, { pagina: 2, porPagina: 10 })).toEqual({
      items: ['a', 'b'],
      total: 25,
      pagina: 2,
      porPagina: 10,
      totalPaginas: 3,
    })
  })

  it('devuelve una página vacía con una sola página cuando no hay resultados', () => {
    expect(armarPagina([], 0, { pagina: 1, porPagina: 20 })).toEqual({
      items: [],
      total: 0,
      pagina: 1,
      porPagina: 20,
      totalPaginas: 1,
    })
  })
})
