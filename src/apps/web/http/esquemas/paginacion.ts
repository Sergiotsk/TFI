import { z } from 'zod'

/** `pagina` empieza en 1; `porPagina` tiene un techo para no pedir toda la tabla. */
export const esquemaPaginacion = z.object({
  pagina: z.coerce.number().int().min(1, 'La página debe ser mayor que cero').default(1),
  porPagina: z.coerce
    .number()
    .int()
    .min(1, 'El tamaño de página debe ser mayor que cero')
    .max(100, 'El tamaño de página no puede superar 100')
    .default(20),
})
