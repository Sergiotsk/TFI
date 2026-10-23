import { EncabezadoDePanel } from '@/components/panel/encabezado-de-panel'
import { TablaDePagos } from '@/components/panel/tabla-de-pagos'
import { conActorDePanel } from '../../../../sesion-de-panel'

// Pagos del informe que no se pudieron imputar a una postulación (ListarBandeja NO_IMPUTADO). Los resuelve
// Tesorería: corrige el dato con el aspirante o le devuelve la plata.
export default async function NoImputadosPage() {
  const pagos = await conActorDePanel(async ({ listarBandeja }, actor) =>
    actor.rol === 'TESORERIA' || actor.rol === 'SECRETARIA' ? listarBandeja.ejecutar(actor, 'NO_IMPUTADO') : null,
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <EncabezadoDePanel
        area="Tesorería TUP"
        titulo="Pagos no imputados"
        descripcion="Pagos del informe que no coinciden con ninguna postulación, o que llegaron de más."
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {pagos === null ? (
          <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            La bandeja de pagos es de Tesorería y Secretaría.
          </p>
        ) : (
          <TablaDePagos pagos={pagos} vacio="No hay pagos sin imputar." />
        )}
      </main>
    </div>
  )
}
