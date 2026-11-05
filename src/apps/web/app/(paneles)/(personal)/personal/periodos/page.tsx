import { CalendarRange, Check, Clock, SquarePlus, Users, type LucideIcon } from 'lucide-react'
import { EncabezadoDePanel } from '@/components/panel/encabezado-de-panel'
import { EstadoVacio } from '@/components/panel/estado-vacio'
import { formatearFecha, formatearMontoEnCentavos, porcentaje } from '@/components/panel/formato'
import { InsigniaDePeriodo } from '@/components/panel/insignia-de-estado'
import { cn } from '@/lib/utils'
import { conActorDePanel } from '../../../sesion-de-panel'
import { EditarPeriodo } from './editar-periodo'
import { NuevoPeriodo } from './nuevo-periodo'
import type { PeriodoDeIngreso } from '@tfi/domain'

// Períodos reales (ListarPeriodosTodos) con su ocupación (ConsultarOcupacion). Dirección los da de alta
// (CrearPeriodo) y los edita (ModificarPeriodo); el resto del personal solo los ve.
export default async function PeriodosPage() {
  const { periodos, esDireccion } = await conActorDePanel(async ({ listarPeriodosTodos, consultarOcupacion }, actor) => {
    const pagina = await listarPeriodosTodos.ejecutar(actor, { pagina: 1, porPagina: 100 })

    return {
      esDireccion: actor.rol === 'DIRECCION',
      periodos: await Promise.all(
        pagina.items.map(async (periodo: PeriodoDeIngreso) => ({
          periodo,
          ocupacion: await consultarOcupacion.ejecutar(actor, periodo.id),
        })),
      ),
    }
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
  const abiertos = periodos.filter(({ periodo }) => periodo.estaAbierto(ahora)).length

  return (
    <div className="min-h-screen text-foreground">
      <EncabezadoDePanel
        area="Secretaría TUP"
        titulo="Períodos de ingreso"
        descripcion="Cupos, cierre y plazo de pago de cada período, con su ocupación actual."
      />

      <main className="mx-auto max-w-6xl space-y-7 px-4 py-8 sm:px-6 lg:px-8">
        {esDireccion ? <NuevoPeriodo abierto={periodos.length === 0} /> : null}

        {periodos.length === 0 ? (
          <EstadoVacio
            icono={CalendarRange}
            titulo="Todavía no hay períodos de ingreso"
            descripcion={
              esDireccion
                ? 'Cuando cargues el primero, vas a ver acá sus cupos y su ocupación.'
                : 'Cuando Dirección cargue un período, vas a ver acá sus cupos y su ocupación.'
            }
          />
        ) : (
          <>
            <section aria-label="Resumen de cupos" className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              <Resumen icono={Users} etiqueta="Cupos totales" valor={totales.cupos} tono="suave" />
              <Resumen icono={Check} etiqueta="Vacantes ocupadas" valor={totales.ocupados} tono="fuerte" />
              <Resumen icono={Clock} etiqueta="Pendientes de pago" valor={totales.pendientes} tono="aviso" />
              <Resumen icono={SquarePlus} etiqueta="Libres para iniciar pago" valor={totales.libres} tono="suave" />
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <h2 className="text-xl font-semibold text-primary">Todos los períodos</h2>
              <span className="text-sm">
                {periodos.length} {periodos.length === 1 ? 'período' : 'períodos'} · {abiertos}{' '}
                {abiertos === 1 ? 'abierto' : 'abiertos'}
              </span>
            </div>
          </>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          {periodos.map(({ periodo, ocupacion }) => {
            const excedido = ocupacion.ocupados > ocupacion.totalCupos
            const abierto = periodo.estaAbierto(ahora)

            return (
              <article key={periodo.id} className="flex flex-col bg-card shadow-(--sombra-tarjeta)">
                <div className="flex items-start justify-between gap-3 px-6 py-5">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-lg font-semibold text-primary">{periodo.nombre}</h3>
                      <InsigniaDePeriodo abierto={abierto} />
                    </div>
                    <span className="block text-sm">
                      {abierto ? 'Cierra' : 'Cerró'} el {formatearFecha(periodo.cierraEl)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3.5 border-t border-border px-6 py-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={cn(
                          'text-[38px] leading-11 font-bold',
                          excedido ? 'text-destructive' : 'text-primary',
                        )}
                      >
                        {ocupacion.ocupados}
                      </span>
                      <span className="text-base">/ {ocupacion.totalCupos} cupos ocupados</span>
                    </div>
                    <span className="text-[15px] font-bold text-primary">
                      {porcentaje(ocupacion.ocupados, ocupacion.totalCupos)} % de ocupación
                    </span>
                  </div>

                  <div
                    role="img"
                    aria-label={`${ocupacion.ocupados} ocupados, ${ocupacion.pendientesVigentes} pendientes de pago y ${ocupacion.libres} libres sobre ${ocupacion.totalCupos} cupos`}
                    className="flex h-2.5 overflow-hidden bg-border/70"
                  >
                    <span
                      className={excedido ? 'bg-destructive' : 'bg-primary'}
                      style={{ width: `${porcentaje(ocupacion.ocupados, ocupacion.totalCupos)}%` }}
                    />
                    <span
                      className="bg-(--senal-cian,var(--secondary))"
                      style={{ width: `${porcentaje(ocupacion.pendientesVigentes, ocupacion.totalCupos)}%` }}
                    />
                  </div>

                  <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                    <li className="flex items-center gap-1.5">
                      <span aria-hidden="true" className="size-2.5 bg-primary" />
                      Ocupados <strong className="text-primary">{ocupacion.ocupados}</strong>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span aria-hidden="true" className="size-2.5 bg-(--senal-cian,var(--secondary))" />
                      Pendientes de pago <strong className="text-primary">{ocupacion.pendientesVigentes}</strong>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span aria-hidden="true" className="size-2.5 bg-border/70 ring-1 ring-input ring-inset" />
                      Libres <strong className="text-primary">{ocupacion.libres}</strong>
                    </li>
                  </ul>

                  {excedido ? (
                    <p className="text-xs text-destructive">
                      Excedido por {ocupacion.ocupados - ocupacion.totalCupos} (pagos aceptados por Dirección)
                    </p>
                  ) : null}
                </div>

                <dl className="mt-auto grid grid-cols-3 divide-x divide-border border-t border-border bg-muted/60">
                  <Dato etiqueta="Plazo de pago" valor={`${periodo.diasPlazoPago} días`} />
                  <Dato etiqueta="Matrícula" valor={formatearMontoEnCentavos(periodo.montoMatriculaCentavos)} />
                  <Dato etiqueta="Libres" valor={ocupacion.libres} />
                </dl>

                {esDireccion ? <EditarPeriodo periodo={periodo} /> : null}
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
  suave: 'bg-accent text-accent-foreground',
  aviso: 'bg-(--senal-ambar,var(--accent)) text-primary',
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
    <div className="flex items-center gap-4 bg-card p-5 shadow-(--sombra-tarjeta)">
      <span aria-hidden="true" className={cn('flex size-11 shrink-0 items-center justify-center', TONOS_DE_RESUMEN[tono])}>
        <Icono className="size-5" />
      </span>
      <div className="min-w-0">
        <span className="block text-[13px]">{etiqueta}</span>
        <span className="block text-3xl font-bold text-primary">{valor}</span>
      </div>
    </div>
  )
}

// Un dato del pie de la tarjeta de período.
function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | number }) {
  return (
    <div className="space-y-1 px-6 py-3.5">
      <dt className="text-xs">{etiqueta}</dt>
      <dd className="text-[15px] font-bold text-primary">{valor}</dd>
    </div>
  )
}
