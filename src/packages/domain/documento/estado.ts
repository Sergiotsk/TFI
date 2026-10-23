// Los mismos valores que el enum public.estado_documento (migración 20261021000100).
export type EstadoDocumento = 'PENDIENTE' | 'APROBADO' | 'OBSERVADO'

/**
 * Transiciones válidas del estado propio de un documento.
 *
 * Secretaría y Dirección pueden aprobar, observar o reabrir un documento. No
 * puede quedar en el mismo estado: un PATCH sin cambio real es un error de la
 * UI, no una transición.
 */
export const TRANSICIONES_DE_DOCUMENTO: Record<
  EstadoDocumento,
  readonly EstadoDocumento[]
> = {
  PENDIENTE: ['APROBADO', 'OBSERVADO'],
  OBSERVADO: ['PENDIENTE', 'APROBADO'],
  APROBADO: ['PENDIENTE', 'OBSERVADO'],
}

/**
 * Tipos de documento del MVP. El nombre es el lenguaje ubicuo y no depende de
 * cómo se llame el archivo que sube el aspirante.
 */
export const TIPOS_DE_DOCUMENTO = [
  'DNI',
  'CONSTANCIA_CUIL',
  'PARTIDA_NACIMIENTO',
  'TITULO',
  'ANALITICO',
  'FOTO',
  'OTRO',
] as const

export type TipoDeDocumento = (typeof TIPOS_DE_DOCUMENTO)[number]
