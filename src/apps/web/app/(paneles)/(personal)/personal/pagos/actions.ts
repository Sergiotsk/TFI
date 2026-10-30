'use server'

import { revalidatePath } from 'next/cache'
import type { ErrorDeLectura, FilaImportada } from '@tfi/application'
import type { ResumenDeCarga } from '@tfi/domain'
import { conActorDePanel, mensajeDeError } from '../../../sesion-de-panel'

/** Tope del archivo: el límite de cuerpo de las server actions es 1 MB. */
const TAMANO_MAXIMO = 1024 * 1024

export type EstadoDeImportacion =
  | {
      ok: true
      mensaje: string
      resumen: ResumenDeCarga
      /** Las filas que no se acreditaron directo: para que Tesorería vea qué revisar. */
      pendientes: FilaImportada[]
      /** Las filas que la admisión no toma (sin Postulación o ya admitidos, ADR 0011). */
      ignoradas: FilaImportada[]
      /** Filas que el filtro de concepto del informe dejó afuera. */
      descartadas: number
      conError: number
    }
  | { ok: false; mensaje: string; errores?: ErrorDeLectura[] }
  | null

const RUTAS_AFECTADAS = ['/personal/pagos', '/personal/postulaciones', '/personal/periodos']

export async function importarInformeAccion(
  _anterior: EstadoDeImportacion,
  datos: FormData,
): Promise<EstadoDeImportacion> {
  const archivo = datos.get('informe')
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { ok: false, mensaje: 'Elegí el archivo del informe.' }
  }
  if (archivo.size > TAMANO_MAXIMO) {
    return { ok: false, mensaje: 'El archivo supera 1 MB.' }
  }
  if (!archivo.name.toLowerCase().endsWith('.xlsx')) {
    return { ok: false, mensaje: 'El informe tiene que ser la planilla de Excel (.xlsx) tal como sale de SysAdmin.' }
  }

  const contenido = new Uint8Array(await archivo.arrayBuffer())

  try {
    const estado = await conActorDePanel(
      async ({ lectorDeInforme, importarInformeDePagos }, actor): Promise<EstadoDeImportacion> => {
        const lectura = await lectorDeInforme.leer(contenido)
        if (!lectura.ok) {
          return {
            ok: false,
            mensaje: 'El informe tiene errores y no se importó ningún pago. Corregilo y volvé a subirlo.',
            errores: lectura.errores,
          }
        }

        if (lectura.pagos.length === 0) {
          return {
            ok: false,
            mensaje: `El informe no tiene pagos de admisión: el filtro de concepto descartó las ${lectura.descartadas} filas.`,
          }
        }

        const { resumen, filas, conError } = await importarInformeDePagos.ejecutar(
          actor,
          archivo.name,
          lectura.pagos,
        )

        return {
          ok: true,
          mensaje: `Informe importado: ${filas.length} pago(s) procesados, ${resumen.ignorados} ignorado(s) por no ser de la admisión.`,
          resumen,
          pendientes: filas.filter(
            (fila: FilaImportada) => fila.resultado !== 'ACREDITADO' && fila.resultado !== 'IGNORADO',
          ),
          ignoradas: filas.filter((fila: FilaImportada) => fila.resultado === 'IGNORADO'),
          descartadas: lectura.descartadas,
          conError,
        }
      },
    )
    for (const ruta of RUTAS_AFECTADAS) revalidatePath(ruta)
    // Los contadores de la barra lateral los calcula el layout.
    revalidatePath('/personal', 'layout')

    return estado
  } catch (error) {
    return { ok: false, mensaje: mensajeDeError(error) }
  }
}
