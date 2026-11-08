/** El laboratorio de endpoints sirve en local y en los previews; en producción no se publica. */
export function laboratorioHabilitado(entornoDeVercel: string | undefined): boolean {
  return entornoDeVercel !== 'production'
}
