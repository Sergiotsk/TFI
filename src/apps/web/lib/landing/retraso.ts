import type { CSSProperties } from 'react'

/**
 * Escalona la aparición de elementos hermanos: el CSS lee --i y lo multiplica por una demora corta.
 * Ejemplo: <li className="reveal" style={retraso(2)}>
 */
export function retraso(indice: number): CSSProperties {
  return { '--i': indice } as CSSProperties
}
