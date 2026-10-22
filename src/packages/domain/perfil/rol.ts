// Los mismos valores que el enum public.rol_usuario (migración 20261021000100).
export type Rol = 'ASPIRANTE' | 'SECRETARIA' | 'DIRECCION' | 'TESORERIA'

// El personal de la facultad: los que no son aspirantes.
export const ROLES_DEL_PERSONAL: readonly Rol[] = ['SECRETARIA', 'DIRECCION', 'TESORERIA']
