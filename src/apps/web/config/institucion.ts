import type { Rol } from '@tfi/domain'

// Los roles se nombran por función (ADR-0007). La etiqueta visible de cada uno
// vive acá y no en el dominio: el dominio dice ASPIRANTE, la institución dice
// "Aspirante" (Principio VIII).
export const INSTITUCION = {
  // Mismo código que public.instituciones. Elige el tema (temas/<codigo>.css). Hay una sola institución
  // (ADR-0006): cuando haya otra, en los paneles sale del perfil logueado y en el login y el registro, que
  // todavía no tienen sesión, de la URL por la que se entró.
  codigo: 'FRH',
  nombre: 'UTN FRH',
  carrera: 'Tecnicatura Universitaria en Programación',
} as const

export const ETIQUETAS_DE_ROL: Record<Rol, string> = {
  ASPIRANTE: 'Aspirante',
  SECRETARIA: 'Secretaría TUP',
  DIRECCION: 'Director de la TUP',
  TESORERIA: 'Administración / Tesorería',
}
