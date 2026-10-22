import type { Rol } from '@tfi/domain'

// Los roles se nombran por función (ADR-0007). La etiqueta visible de cada uno
// vive acá y no en el dominio: el dominio dice ASPIRANTE, la institución dice
// "Aspirante" (Principio VIII).
export const INSTITUCION = {
  nombre: 'UTN FRH',
  carrera: 'Tecnicatura Universitaria en Programación',
} as const

export const ETIQUETAS_DE_ROL: Record<Rol, string> = {
  ASPIRANTE: 'Aspirante',
  SECRETARIA: 'Secretaría TUP',
  DIRECCION: 'Director de la TUP',
  TESORERIA: 'Administración / Tesorería',
}
