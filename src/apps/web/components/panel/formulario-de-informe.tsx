'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import type { MotivoNoImputado, MotivoRevision } from '@tfi/domain'
import { Button } from '@/components/ui/button'
import { motivosDeNoImputado, motivosDeRevision } from '@/components/panel/insignia-de-estado'
import type { EstadoDeImportacion } from '@/app/(paneles)/(personal)/personal/pagos/actions'

interface FormularioDeInformeProps {
  accion: (anterior: EstadoDeImportacion, datos: FormData) => Promise<EstadoDeImportacion>
}

const resultados = {
  A_DECIDIR: 'A decidir por Dirección',
  NO_IMPUTADO: 'No imputado',
  DUPLICADO: 'Ya estaba cargado',
  ERROR: 'Error: volvé a subir el informe',
} as const

function motivoLegible(motivo: string | undefined): string {
  if (motivo === undefined) return ''
  if (motivo in motivosDeNoImputado) return motivosDeNoImputado[motivo as MotivoNoImputado]
  if (motivo in motivosDeRevision) return motivosDeRevision[motivo as MotivoRevision]
  return motivo
}

// Subida del informe de pagos del día (US1). Muestra el resumen y las filas que hay que mirar.
export function FormularioDeInforme({ accion }: FormularioDeInformeProps) {
  const [estado, ejecutar, enviando] = useActionState(accion, null)

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-xs">
      <div>
        <h2 className="text-base font-semibold">Importar el informe de pagos</h2>
        <p className="text-sm text-muted-foreground">
          CSV con las columnas referencia, dni o numero, monto y fecha_pago. Si el mismo pago ya se cargó, no se
          vuelve a acreditar.
        </p>
      </div>

      <form action={ejecutar} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 space-y-1 text-sm">
          <span className="block text-xs font-medium text-muted-foreground">Archivo del informe</span>
          <input
            type="file"
            name="informe"
            accept=".csv,text/csv"
            required
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
          />
        </label>
        <Button type="submit" disabled={enviando}>
          {enviando ? 'Importando…' : 'Importar'}
        </Button>
      </form>

      {estado ? (
        <div className="space-y-3">
          <p role={estado.ok ? 'status' : 'alert'} className={estado.ok ? 'text-sm text-primary' : 'text-sm text-destructive'}>
            {estado.mensaje}
          </p>

          {!estado.ok && estado.errores ? (
            <ul className="max-h-60 space-y-1 overflow-y-auto rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs">
              {estado.errores.map((error) => (
                <li key={`${error.linea}-${error.mensaje}`}>
                  <span className="font-semibold">Línea {error.linea}:</span> {error.mensaje}
                </li>
              ))}
            </ul>
          ) : null}

          {estado.ok ? (
            <>
              <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                {(
                  [
                    ['Acreditados', estado.resumen.acreditados],
                    ['A decidir', estado.resumen.aDecidir],
                    ['No imputados', estado.resumen.noImputados],
                    ['Duplicados', estado.resumen.duplicados],
                  ] as const
                ).map(([etiqueta, valor]) => (
                  <div key={etiqueta} className="rounded-lg border border-border p-2">
                    <dt className="text-muted-foreground">{etiqueta}</dt>
                    <dd className="text-base font-semibold">{valor}</dd>
                  </div>
                ))}
              </dl>

              {estado.resumen.noImputados > 0 ? (
                <Link href="/personal/pagos/no-imputados" className="text-sm font-medium text-primary underline">
                  Ver los pagos no imputados
                </Link>
              ) : null}

              {estado.pendientes.length > 0 ? (
                <ul className="space-y-1 text-xs">
                  {estado.pendientes.map((fila) => (
                    <li key={fila.referencia} className="flex flex-wrap gap-x-2">
                      <span className="font-mono">{fila.referencia}</span>
                      <span className="font-semibold">
                        {fila.resultado === 'ACREDITADO' ? 'Acreditado' : resultados[fila.resultado]}
                      </span>
                      <span className="text-muted-foreground">{motivoLegible(fila.motivo)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
