import { AccionPendiente } from '@/components/maqueta/accion-pendiente'
import { EncabezadoDePanel } from '@/components/panel/encabezado-de-panel'
import { InsigniaDePago, motivosDeRevision } from '@/components/panel/insignia-de-estado'
import {
  casosADecidir,
  formatearFecha,
  formatearMonto,
  formatearNumero,
} from '@/maquetas/datos'

// Maqueta de T091 con datos de ejemplo. Sin guarda de sesión: la protege el proxy del plan de login.
// Se conecta a GET /api/pagos?estado=A_DECIDIR y POST /api/pagos/:id/decision (contracts/api-http.md).
export default function CasosDeDireccionPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <EncabezadoDePanel
        area="Director de la TUP"
        titulo="Pagos a decidir"
        descripcion="Pagos acreditados que no se pudieron confirmar solos. Aceptar confirma la vacante aunque se pase el cupo."
      />

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
        {casosADecidir.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay casos pendientes.</p>
        ) : null}

        {casosADecidir.map((caso) => (
          <article key={caso.pagoId} className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-xs">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-base font-semibold">{caso.aspirante}</h2>
                <p className="text-xs text-muted-foreground">
                  DNI {caso.dni} · <span className="font-mono">{formatearNumero(caso.numero)}</span>
                </p>
              </div>
              <InsigniaDePago estado="A_DECIDIR" />
            </div>

            <p className="text-sm font-medium">{motivosDeRevision[caso.motivo]}</p>

            <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <div>
                <dt className="text-muted-foreground">Monto</dt>
                <dd className="font-semibold">{formatearMonto(caso.montoCentavos)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Pagó el</dt>
                <dd className="font-semibold">{formatearFecha(caso.pagadoEl)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Vencía el</dt>
                <dd className="font-semibold">{formatearFecha(caso.venceEl)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Ocupación del período</dt>
                <dd className="font-semibold">
                  {caso.ocupados} / {caso.cupos}
                </dd>
              </div>
            </dl>

            <div className="space-y-3 border-t border-border pt-4">
              <label className="block space-y-1 text-xs">
                <span className="text-muted-foreground">Comentario (opcional)</span>
                <textarea
                  rows={2}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </label>
              <div className="flex flex-wrap gap-3">
                <AccionPendiente>Aceptar pago</AccionPendiente>
                <AccionPendiente variant="destructive">Rechazar y devolver</AccionPendiente>
              </div>
            </div>
          </article>
        ))}
      </main>
    </div>
  )
}
