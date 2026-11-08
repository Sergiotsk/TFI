import { z } from 'zod'
import { PeriodoDeIngreso } from '@tfi/domain'

const esquemaFilaDePeriodo = z.object({
  id: z.string().uuid(),
  institucion_id: z.string().uuid(),
  nombre: z.string(),
  total_cupos: z.number().int().nonnegative(),
  cierra_el: z.string(),
  dias_plazo_pago: z.number().int().positive(),
  monto_matricula_centavos: z.number().int().positive(),
})

export function mapearPeriodo(fila: unknown): PeriodoDeIngreso {
  const datos = esquemaFilaDePeriodo.parse(fila)

  return new PeriodoDeIngreso(
    datos.id,
    datos.institucion_id,
    datos.nombre,
    datos.total_cupos,
    new Date(datos.cierra_el),
    datos.dias_plazo_pago,
    datos.monto_matricula_centavos,
  )
}
