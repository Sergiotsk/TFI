import { CalendarRange, Check, Clock, SquarePlus, Users, type LucideIcon } from 'lucide-react'
import { AccionPendiente } from '@/components/maqueta/accion-pendiente'
import { EncabezadoDePanel } from '@/components/panel/encabezado-de-panel'
import { EstadoVacio } from '@/components/panel/estado-vacio'
import { formatearFecha, formatearMontoEnCentavos, porcentaje } from '@/components/panel/formato'
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

  const ahora = new Date()
  const totales = periodos.reduce(
    (suma, { ocupacion }) => ({
      cupos: suma.cupos + ocupacion.totalCupos,
      ocupados: suma.ocupados + ocupacion.ocupados,
      pendientes: suma.pendientes + ocupacion.pendientesVigentes,
      libres: suma.libres + ocupacion.libres,
    }),
    { cupos: 0, ocupados: 0, pendientes: 0, libres: 0 },
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <EncabezadoDePanel
        area="Secretaría TUP"
        titulo="Períodos de ingreso"
        descripcion="Cupos, cierre y plazo de pago de cada período, con su ocupación actual."
        acciones={<AccionPendiente>Nuevo período</AccionPendiente>}
      />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {periodos.length === 0 ? (
          <EstadoVacio
            icono={CalendarRange}
            titulo="Todavía no hay períodos de ingreso"
            descripcion="Cuando Dirección cargue un período, vas a ver acá sus cupos y su ocupación."
          />
        ) : (
          <section aria-label="Resumen de cupos" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Resumen icono={Users} etiqueta="Cupos totales" valor={totales.cupos} tono="suave" />
            <Resumen icono={Check} etiqueta="Vacantes ocupadas" valor={totales.ocupados} tono="fuerte" />
            <Resumen icono={Clock} etiqueta="Pendientes de pago" valor={totales.pendientes} tono="aviso" />
            <Resumen icono={SquarePlus} etiqueta="Libres para iniciar pago" valor={totales.libres} tono="neutro" />
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {periodos.map(({ periodo, ocupacion }) => {
            const excedido = ocupacion.ocupados > ocupacion.totalCupos
            const abierto = periodo.cierraEl > ahora

            return (
              <article key={periodo.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
                <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-5">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">{periodo.nombre}</h2>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                          abierto
                            ? 'border-primary/30 bg-primary/10 text-primary'
                            : 'border-border bg-muted text-muted-foreground',
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn('size-1.5 rounded-full', abierto ? 'bg-primary' : 'bg-muted-foreground/60')}
                        />
                        {abierto ? 'Abierto' : 'Cerrado'}
                      </span>
                    </div>
                    <span className="block text-sm text-muted-foreground">
                      Cierra el {formatearFecha(periodo.cierraEl)}
                    </span>
                  </div>
                  <AccionPendiente variant="outline" size="sm">
                    Editar
                  </AccionPendiente>
                </div>

                <div className="space-y-4 px-6 py-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={cn('text-4xl font-bold tracking-tight', excedido ? 'text-destructive' : 'text-foreground')}
                      >
                        {ocupacion.ocupados}
                      </span>
                      <span className="text-base font-medium text-muted-foreground">
                        / {ocupacion.totalCupos} cupos ocupados
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      {porcentaje(ocupacion.ocupados, ocupacion.totalCupos)} % de ocupación
                    </span>
                  </div>

                  <div
                    role="img"
                    aria-label={`${ocupacion.ocupados} ocupados, ${ocupacion.pendientesVigentes} pendientes de pago y ${ocupacion.libres} libres sobre ${ocupacion.totalCupos} cupos`}
                    className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-muted"
                  >
                    <span
                      className={excedido ? 'bg-destructive' : 'bg-primary'}
                      style={{ width: `${porcentaje(ocupacion.ocupados, ocupacion.totalCupos)}%` }}
                    />
                    <span
                      className="bg-secondary/60"
                      style={{ width: `${porcentaje(ocupacion.pendientesVigentes, ocupacion.totalCupos)}%` }}
                    />
                  </div>

                  <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span aria-hidden="true" className="size-2.5 rounded-sm bg-primary" />
                      Ocupados <strong className="text-foreground">{ocupacion.ocupados}</strong>
                    </li>
                    <li className="flex items-center gap-2">
                      <span aria-hidden="true" className="size-2.5 rounded-sm bg-secondary/60" />
                      Pendientes de pago <strong className="text-foreground">{ocupacion.pendientesVigentes}</strong>
                    </li>
                    <li className="flex items-center gap-2">
                      <span aria-hidden="true" className="size-2.5 rounded-sm border border-input bg-muted" />
                      Libres <strong className="text-foreground">{ocupacion.libres}</strong>
                    </li>
                  </ul>

                  {excedido ? (
                    <p className="text-xs text-destructive">
                      Excedido por {ocupacion.ocupados - ocupacion.totalCupos} (pagos aceptados por Dirección)
                    </p>
                  ) : null}
                </div>

                <dl className="grid grid-cols-3 divide-x divide-border border-t border-border bg-muted/40">
                  <div className="space-y-1 px-6 py-4">
                    <dt className="text-xs text-muted-foreground">Plazo de pago</dt>
                    <dd className="text-sm font-semibold">{periodo.diasPlazoPago} días</dd>
                  </div>
                  <div className="space-y-1 px-6 py-4">
                    <dt className="text-xs text-muted-foreground">Matrícula</dt>
                    <dd className="text-sm font-semibold">{formatearMontoEnCentavos(periodo.montoMatriculaCentavos)}</dd>
                  </div>
                  <div className="space-y-1 px-6 py-4">
                    <dt className="text-xs text-muted-foreground">Libres</dt>
                    <dd className="text-sm font-semibold">{ocupacion.libres}</dd>
                  </div>
                </dl>
              </article>
            )
          })}
        </div>
      </main>
    </div>
  )
}

const TONOS_DE_RESUMEN = {
  fuerte: 'bg-primary text-primary-foreground',
  suave: 'bg-primary/10 text-primary',
  aviso: 'bg-accent text-accent-foreground',
  neutro: 'bg-muted text-muted-foreground',
} as const

// Tarjeta de un total del resumen de cupos.
function Resumen({
  icono: Icono,
  etiqueta,
  valor,
  tono,
}: {
  icono: LucideIcon
  etiqueta: string
  valor: number
  tono: keyof typeof TONOS_DE_RESUMEN
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4 shadow-xs">
      <span
        aria-hidden="true"
        className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl', TONOS_DE_RESUMEN[tono])}
      >
        <Icono className="size-5" />
      </span>
      <div className="min-w-0">
        <span className="block text-xs text-muted-foreground">{etiqueta}</span>
        <span className="block text-2xl font-bold tracking-tight">{valor}</span>
      </div>
    </div>
  )
}
