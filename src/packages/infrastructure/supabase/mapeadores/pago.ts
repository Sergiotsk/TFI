import { z } from 'zod'
import {
  CargaDeInforme,
  Dni,
  ESTADOS_DE_PAGO,
  MOTIVOS_NO_IMPUTADO,
  Monto,
  NumeroDePostulacion,
  Pago,
  PROVEEDORES_DE_PAGO,
  ReferenciaDePago,
} from '@tfi/domain'

// La fila de public.pagos, tal como llega de PostgREST o del jsonb de la RPC.
const esquemaFilaDePago = z.object({
  id: z.string().uuid(),
  proveedor: z.enum(PROVEEDORES_DE_PAGO),
  referencia_externa: z.string(),
  monto_centavos: z.coerce.number().int().positive(),
  pagado_el: z.string(),
  registrado_el: z.string(),
  estado: z.enum(ESTADOS_DE_PAGO),
  motivo_revision: z.enum(['FUERA_DE_PLAZO', 'SIN_CUPO']).nullable(),
  motivo_no_imputado: z.enum(MOTIVOS_NO_IMPUTADO).nullable(),
  postulacion_id: z.string().uuid().nullable(),
  carga_id: z.string().uuid().nullable(),
  dni_informado: z.string().nullable(),
  numero_informado: z.coerce.number().int().positive().nullable(),
})

export const COLUMNAS_DE_PAGO =
  'id, proveedor, referencia_externa, monto_centavos, pagado_el, registrado_el, estado, motivo_revision, motivo_no_imputado, postulacion_id, carga_id, dni_informado, numero_informado'

export function mapearPago(fila: unknown): Pago {
  const datos = esquemaFilaDePago.parse(fila)

  return new Pago(
    datos.id,
    new ReferenciaDePago(datos.proveedor, datos.referencia_externa),
    new Monto(datos.monto_centavos),
    new Date(datos.pagado_el),
    new Date(datos.registrado_el),
    datos.estado,
    {
      motivoRevision: datos.motivo_revision ?? undefined,
      motivoNoImputado: datos.motivo_no_imputado ?? undefined,
      postulacionId: datos.postulacion_id ?? undefined,
      cargaId: datos.carga_id ?? undefined,
      dniInformado: datos.dni_informado === null ? undefined : new Dni(datos.dni_informado),
      numeroInformado:
        datos.numero_informado === null ? undefined : NumeroDePostulacion.desde(datos.numero_informado),
    },
  )
}

const esquemaFilaDeCarga = z.object({
  id: z.string().uuid(),
  institucion_id: z.string().uuid(),
  cargada_por: z.string().uuid(),
  cargada_el: z.string(),
  nombre_archivo: z.string(),
  acreditados: z.number().int().nonnegative(),
  a_decidir: z.number().int().nonnegative(),
  no_imputados: z.number().int().nonnegative(),
  duplicados: z.number().int().nonnegative(),
})

export const COLUMNAS_DE_CARGA =
  'id, institucion_id, cargada_por, cargada_el, nombre_archivo, acreditados, a_decidir, no_imputados, duplicados'

export function mapearCarga(fila: unknown): CargaDeInforme {
  const datos = esquemaFilaDeCarga.parse(fila)

  return new CargaDeInforme(
    datos.id,
    datos.institucion_id,
    datos.cargada_por,
    new Date(datos.cargada_el),
    datos.nombre_archivo,
    {
      acreditados: datos.acreditados,
      aDecidir: datos.a_decidir,
      noImputados: datos.no_imputados,
      duplicados: datos.duplicados,
    },
  )
}
