/**
 * Paginación de los listados.
 *
 * La paginación es una preocupación de la aplicación y de los adaptadores, no
 * del dominio: las entidades no saben cuántas filas se piden. `Pagina<T>` es el
 * sobre que devuelven los puertos paginados y que la API expone tal cual.
 */
export interface Paginacion {
  /** Página pedida, empieza en 1. */
  pagina: number
  /** Tamaño de la página. El máximo lo fija `normalizarPaginacion`. */
  porPagina: number
}

export interface Pagina<T> {
  items: T[]
  total: number
  pagina: number
  porPagina: number
  totalPaginas: number
}

export const PAGINACION_POR_DEFECTO: Paginacion = { pagina: 1, porPagina: 20 }
export const MAXIMO_POR_PAGINA = 100

/**
 * Normaliza lo que llega del borde: una página fuera de rango cae en la primera
 * y un tamaño inválido usa el máximo. El borde igual valida con Zod; esto es la
 * red de seguridad para los casos de uso que se llaman desde tests.
 */
export function normalizarPaginacion(paginacion?: Partial<Paginacion>): Paginacion {
  const paginaPedida = paginacion?.pagina
  const porPaginaPedido = paginacion?.porPagina

  const pagina =
    typeof paginaPedida === 'number' && Number.isInteger(paginaPedida) && paginaPedida > 0
      ? paginaPedida
      : PAGINACION_POR_DEFECTO.pagina

  const porPagina =
    typeof porPaginaPedido === 'number' &&
    Number.isInteger(porPaginaPedido) &&
    porPaginaPedido > 0
      ? Math.min(porPaginaPedido, MAXIMO_POR_PAGINA)
      : PAGINACION_POR_DEFECTO.porPagina

  return { pagina, porPagina }
}

/** Rango inclusivo que espera `.range(desde, hasta)` de Supabase. */
export function rangoDe(paginacion: Paginacion): { desde: number; hasta: number } {
  const desde = (paginacion.pagina - 1) * paginacion.porPagina

  return { desde, hasta: desde + paginacion.porPagina - 1 }
}

export function armarPagina<T>(
  items: T[],
  total: number,
  paginacion: Paginacion,
): Pagina<T> {
  return {
    items,
    total,
    pagina: paginacion.pagina,
    porPagina: paginacion.porPagina,
    totalPaginas: Math.max(1, Math.ceil(total / paginacion.porPagina)),
  }
}
