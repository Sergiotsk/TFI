/**
 * Genera identificadores para las entidades nuevas.
 *
 * Es un puerto porque la aleatoriedad es una dependencia del entorno: el
 * dominio y la aplicación no saben de `crypto` ni de Node. Los tests usan
 * `GeneradorDeIdsFake`, que devuelve ids previsibles.
 */
export interface GeneradorDeIds {
  nuevo(): string
}
