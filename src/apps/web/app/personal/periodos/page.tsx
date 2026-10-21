import { AccionPendiente } from '@/components/maqueta/accion-pendiente'
import { EncabezadoDePanel } from '@/components/panel/encabezado-de-panel'
import { cn } from '@/lib/utils'
import { formatearFecha, formatearMonto, periodosConOcupacion } from '@/maquetas/datos'

// Maqueta de T097 con datos de ejemplo. Sin guarda de sesión: la protege el proxy del plan de login.
// Se conecta a /api/periodos y /api/periodos/:id/ocupacion (contracts/api-http.md).
export default function PeriodosPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <EncabezadoDePanel
        area="Secretaría TUP"
        titulo="Períodos de ingreso"
        descripcion="Cupos, cierre y plazo de pago de cada período, con su ocupación actual."
        acciones={<AccionPendiente>Nuevo período</AccionPendiente>}
      />

      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-2 lg:px-8">
        {periodosConOcupacion.map((periodo) => {
          const excedido = periodo.ocupados > periodo.cupos
          const libres = Math.max(periodo.cupos - periodo.ocupados - periodo.pendientesVigentes, 0)

          return (
            <article key={periodo.id} className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold">{periodo.nombre}</h2>
                <AccionPendiente variant="outline" size="sm">
                  Editar
                </AccionPendiente>
              </div>

              <div>
                <span className="block text-xs text-muted-foreground">Ocupación</span>
                <span className={cn('text-3xl font-bold', excedido ? 'text-destructive' : 'text-foreground')}>
                  {periodo.ocupados} / {periodo.cupos}
                </span>
                {excedido ? (
                  <span className="block text-xs text-destructive">
                    Excedido por {periodo.ocupados - periodo.cupos} (pagos aceptados por Dirección)
                  </span>
                ) : null}
              </div>

              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Pendientes de pago vigentes</dt>
                  <dd className="font-semibold">{periodo.pendientesVigentes}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Libres para iniciar pago</dt>
                  <dd className="font-semibold">{libres}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Cierra el</dt>
                  <dd className="font-semibold">{formatearFecha(periodo.cierraEl)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Plazo de pago</dt>
                  <dd className="font-semibold">{periodo.plazoDePagoDias} días</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Matrícula</dt>
                  <dd className="font-semibold">{formatearMonto(periodo.matriculaCentavos)}</dd>
                </div>
              </dl>
            </article>
          )
        })}
      </main>
    </div>
  )
}
