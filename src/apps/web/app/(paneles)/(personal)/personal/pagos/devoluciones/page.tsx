import { EncabezadoDePanel } from '@/components/panel/encabezado-de-panel'
import { TablaDePagos } from '@/components/panel/tabla-de-pagos'
import { conActorDePanel } from '../../../../sesion-de-panel'

// Pagos que Dirección rechazó (ListarBandeja DEVUELTO): Tesorería reintegra la matrícula fuera del sistema (FR-014).
export default async function DevolucionesPage() {
  const pagos = await conActorDePanel(async ({ listarBandeja }, actor) =>
    actor.rol === 'TESORERIA' || actor.rol === 'SECRETARIA' ? listarBandeja.ejecutar(actor, 'DEVUELTO') : null,
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <EncabezadoDePanel
        area="Tesorería TUP"
        titulo="Devoluciones pendientes"
        descripcion="Pagos que Dirección rechazó: hay que reintegrarle la matrícula al aspirante."
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {pagos === null ? (
          <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            La bandeja de pagos es de Tesorería y Secretaría.
          </p>
        ) : (
          <TablaDePagos pagos={pagos} vacio="No hay devoluciones pendientes." />
        )}
      </main>
    </div>
  )
}
