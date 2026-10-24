import { AccionPendiente } from '@/components/maqueta/accion-pendiente'
import { EncabezadoDePanel } from '@/components/panel/encabezado-de-panel'
import { formatearFecha, formatearMontoEnCentavos } from '@/components/panel/formato'
import { cn } from '@/lib/utils'
import { conActorDePanel } from '../../../sesion-de-panel'
import type { PeriodoDeIngreso } from '@tfi/domain'

// Períodos reales (ListarPeriodosTodos) con su ocupación (ConsultarOcupacion).
// Alta y edición siguen pendientes: las migraciones las restringen a Dirección y falta definir el formulario.
export default async function PeriodosPage() {
  const periodos = await conActorDePanel(async ({ listarPeriodosTodos, consultarOcupacion }, actor) => {
    const pagina = await listarPeriodosTodos.ejecutar(actor, { pagina: 1, porPagina: 100 })

    return Promise.all(
      pagina.items.map(async (periodo: PeriodoDeIngreso) => ({
        periodo,
        ocupacion: await consultarOcupacion.ejecutar(actor, periodo.id),
      })),
    )
  })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <EncabezadoDePanel
        area="Secretaría TUP"
        titulo="Períodos de ingreso"
        descripcion="Cupos, cierre y plazo de pago de cada período, con su ocupación actual."
        acciones={<AccionPendiente>Nuevo período</AccionPendiente>}
      />

      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-2 lg:px-8">
        {periodos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay períodos de ingreso.</p>
        ) : null}

        {periodos.map(({ periodo, ocupacion }) => {
          const excedido = ocupacion.ocupados > ocupacion.totalCupos

          return (
            <article
              key={periodo.id}
              className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold">{periodo.nombre}</h2>
                <AccionPendiente variant="outline" size="sm">
                  Editar
                </AccionPendiente>
              </div>

              <div>
                <span className="block text-xs text-muted-foreground">Ocupación</span>
                <span className={cn('text-3xl font-bold', excedido ? 'text-destructive' : 'text-foreground')}>
                  {ocupacion.ocupados} / {ocupacion.totalCupos}
                </span>
                {excedido ? (
                  <span className="block text-xs text-destructive">
                    Excedido por {ocupacion.ocupados - ocupacion.totalCupos} (pagos aceptados por Dirección)
                  </span>
                ) : null}
              </div>

              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Pendientes de pago vigentes</dt>
                  <dd className="font-semibold">{ocupacion.pendientesVigentes}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Libres para iniciar pago</dt>
                  <dd className="font-semibold">{ocupacion.libres}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Cierra el</dt>
                  <dd className="font-semibold">{formatearFecha(periodo.cierraEl)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Plazo de pago</dt>
                  <dd className="font-semibold">{periodo.diasPlazoPago} días</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Matrícula</dt>
                  <dd className="font-semibold">{formatearMontoEnCentavos(periodo.montoMatriculaCentavos)}</dd>
                </div>
              </dl>
            </article>
          )
        })}
      </main>
    </div>
  )
}
