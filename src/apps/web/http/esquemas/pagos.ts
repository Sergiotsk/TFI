import { z } from 'zod'
import { Dni, Monto, NumeroDePostulacion, ReferenciaDePago, type PagoInformado } from '@tfi/domain'

export const esquemaIniciarPagoConPasarela = z.object({
  postulacionId: z.string().uuid({ message: 'postulacionId debe ser un UUID válido' }),
})

/** Una fila del informe, ya leída, tal como llega en JSON (T071). */
const esquemaPagoInformado = z
  .object({
    referencia: z.string().trim().min(1, 'Falta la referencia'),
    dni: z
      .string()
      .regex(/^[0-9]{7,8}$/, 'El DNI debe tener 7 u 8 dígitos')
      .optional(),
    numero: z.number().int().positive().optional(),
    montoCentavos: z.number().int().positive('El monto tiene que ser mayor a 0'),
    pagadoEl: z.string().datetime({ offset: true, message: 'La fecha de pago tiene que ser ISO con zona' }),
  })
  .refine((fila) => fila.dni !== undefined || fila.numero !== undefined, {
    message: 'Cada pago necesita el DNI o el número de Postulación',
  })
  .transform(
    (fila): PagoInformado => ({
      referencia: new ReferenciaDePago('INFORME_SYSADMIN', fila.referencia),
      monto: new Monto(fila.montoCentavos),
      pagadoEl: new Date(fila.pagadoEl),
      dni: fila.dni === undefined ? undefined : new Dni(fila.dni),
      numero: fila.numero === undefined ? undefined : NumeroDePostulacion.desde(fila.numero),
    }),
  )

/** `POST /api/pagos/acreditaciones` */
export const esquemaAcreditaciones = z.object({
  nombreArchivo: z.string().trim().min(1).max(255).default('informe-por-api'),
  pagos: z.array(esquemaPagoInformado).min(1, 'El informe no tiene pagos').max(5000),
})

/** `GET /api/pagos?estado=` */
export const esquemaEstadoDeBandeja = z.enum(['A_DECIDIR', 'NO_IMPUTADO', 'DEVUELTO'], {
  message: 'El estado tiene que ser A_DECIDIR, NO_IMPUTADO o DEVUELTO',
})

/** `POST /api/pagos/:id/decision` (US5) */
export const esquemaParametrosDePago = z.object({
  id: z.string().uuid('El id del pago no es válido'),
})

export const esquemaDecision = z.object({
  decision: z.enum(['ACEPTAR', 'RECHAZAR'], { message: 'La decisión tiene que ser ACEPTAR o RECHAZAR' }),
  comentario: z.string().trim().max(500, 'El comentario no puede superar los 500 caracteres').optional(),
})
