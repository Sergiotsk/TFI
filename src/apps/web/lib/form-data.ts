/**
 * Lectura de campos de FormData en los Server Actions: los campos llegan
 * siempre como texto, y un campo opcional ausente no es una cadena vacia.
 */
export function textoDelCampo(datos: FormData, campo: string): string | null {
  const valor = datos.get(campo)
  return typeof valor === 'string' ? valor : null
}

export function textoOpcionalDelCampo(datos: FormData, campo: string): string | undefined {
  const valor = textoDelCampo(datos, campo)
  return valor === null || valor.trim() === '' ? undefined : valor
}
