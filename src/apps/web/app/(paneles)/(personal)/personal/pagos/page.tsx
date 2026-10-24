import { EncabezadoDePanel } from '@/components/panel/encabezado-de-panel'
import { FormularioDeInforme } from '@/components/panel/formulario-de-informe'
import { formatearFecha } from '@/components/panel/formato'
import { conActorDePanel } from '../../../sesion-de-panel'
import { importarInformeAccion } from './actions'

// Informes de pagos (T073): Tesorería importa el informe del día y ve el historial de cargas; Secretaría consulta
// el historial. Las bandejas (no imputados y devoluciones) tienen su propia pantalla.
export default async function InformesDePagosPage() {
  const datos = await conActorDePanel(async ({ listarCargasDeInforme }, actor) => {
    if (actor.rol !== 'TESORERIA' && actor.rol !== 'SECRETARIA') return null

    return {
      cargas: await listarCargasDeInforme.ejecutar(actor),
      puedeImportar: actor.rol === 'TESORERIA',
    }
  })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <EncabezadoDePanel
        area="Tesorería TUP"
        titulo="Informes de pagos"
        descripcion="El informe diario de SysAdmin acredita los pagos: cada pago con su postulación confirma la vacante."
      />

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {datos === null ? (
          <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Los informes de pagos son de Tesorería y Secretaría.
          </p>
        ) : (
          <>
            {datos.puedeImportar ? <FormularioDeInforme accion={importarInformeAccion} /> : null}

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Historial de cargas</h2>
              {datos.cargas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Todavía no se cargó ningún informe.</p>
              ) : (
                <ul className="space-y-3">
                  {datos.cargas.map((carga) => (
                    <li key={carga.id} className="rounded-2xl border border-border bg-card p-4 shadow-xs">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <span className="font-mono text-xs break-all">{carga.nombreArchivo}</span>
                        <span className="text-xs text-muted-foreground">{formatearFecha(carga.cargadaEl)}</span>
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                        <div>
                          <dt className="text-muted-foreground">Acreditados</dt>
                          <dd className="font-semibold">{carga.resumen.acreditados}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">A decidir</dt>
                          <dd className="font-semibold">{carga.resumen.aDecidir}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">No imputados</dt>
                          <dd className="font-semibold">{carga.resumen.noImputados}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Duplicados</dt>
                          <dd className="font-semibold">{carga.resumen.duplicados}</dd>
                        </div>
                      </dl>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
