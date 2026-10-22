import { z } from 'zod'

export const esquemaCrearPeriodo = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(150),
  totalCupos: z.coerce.number().int().min(0, 'El total de cupos no puede ser negativo'),
  cierraEl: z.coerce.date(),
  diasPlazoPago: z.coerce.number().int().min(1, 'El plazo debe ser de al menos un día'),
  montoMatriculaCentavos: z.coerce.number().int().min(1, 'El monto debe ser mayor que cero'),
})
