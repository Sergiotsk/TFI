/**
 * La hora del sistema, detrás de un puerto.
 *
 * El dominio no lee `new Date()`: las transiciones reciben `ahora` como
 * parámetro. Así los casos de uso y los tests controlan el tiempo (por ejemplo,
 * para que una Postulación venza) sin dormir ni esperar.
 */
export interface Reloj {
  ahora(): Date
}
