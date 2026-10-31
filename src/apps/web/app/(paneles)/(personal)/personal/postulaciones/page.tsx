import Link from 'next/link'
import { Check, Search } from 'lucide-react'
import { EncabezadoDePanel } from '@/components/panel/encabezado-de-panel'
import { FormularioDeAccion } from '@/components/panel/formulario-de-accion'
import { describirVencimiento, formatearFecha } from '@/components/panel/formato'
import { InsigniaDePostulacion } from '@/components/panel/insignia-de-estado'
import { cn } from '@/lib/utils'
import { conActorDePanel, mensajeDeError } from '../../../sesion-de-panel'
import { acreditarPagoAccion, prorrogarPlazoAccion } from './actions'
import { esquemaBusquedaDeDni, esquemaPaginaDeSeguimiento } from './esquemas'
import type { Pagina, PostulacionConsultada } from '@tfi/application'

const POR_PAGINA = 20
const ESTILO_DE_PAGINA = 'inline-flex h-8 items-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted'

function primero(valor: string | string[] | undefined): string {
  return (Array.isArray(valor) ? valor[0] : valor) ?? ''
}

// Seguimiento de postulaciones del personal: BuscarPostulacionesPorDni / ListarPostulaciones, y las acciones manuales
// AcreditarPagoManual y ProrrogarPlazoDePago (ADR 0009: las pueden usar los tres roles del personal).
export default async function PostulacionesDelPersonalPage({
  searchParams,
}: {
  searchParams: Promise<{ [clave: string]: string | string[] | undefined }>
}) {
  const consulta = await searchParams
  const dniIngresado = primero(consulta.dni).trim()
  const pagina = esquemaPaginaDeSeguimiento.parse(primero(consulta.pagina) || undefined)
  const dni = dniIngresado ? esquemaBusquedaDeDni.safeParse(dniIngresado) : null

  let errorDeBusqueda: string | null =
    dni && !dni.success ? (dni.error.issues[0]?.message ?? 'DNI inválido') : null
  let resultado: Pagina<PostulacionConsultada> | null = null

  if (!dni || dni.success) {
    try {
      resultado = await conActorDePanel(({ buscarPostulacionesPorDni, listarPostulaciones }, actor) => {
        const paginacion = { pagina, porPagina: POR_PAGINA }

        return dni?.success
          ? buscarPostulacionesPorDni.ejecutar(actor, dni.data, undefined, paginacion)
          : listarPostulaciones.ejecutar(actor, {}, paginacion)
      })
    } catch (error) {
      errorDeBusqueda = mensajeDeError(error)
    }
  }

  const ahora = new Date()
  const enlace = (destino: number) =>
    `?${new URLSearchParams({ ...(dniIngresado ? { dni: dniIngresado } : {}), pagina: String(destino) })}`

  return (
    <div className="min-h-screen bg-background text-foreground">
      <EncabezadoDePanel
        area="Personal de la TUP"
        titulo="Postulaciones"
        descripcion="Buscá por DNI, acreditá pagos verificados fuera del sistema o prorrogá el plazo de pago."
      />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <form
          method="get"
          className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-5 shadow-xs"
        >
          <label className="w-full max-w-sm space-y-1.5">
            <span className="block text-xs font-medium text-muted-foreground">DNI del aspirante</span>
            <span className="relative block">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                name="dni"
                defaultValue={dniIngresado}
                inputMode="numeric"
                placeholder="Todas las postulaciones"
                className="h-10 w-full rounded-lg border border-input bg-background pr-3 pl-9 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </span>
          </label>
          <button
            type="submit"
            className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Buscar
          </button>
          {dniIngresado ? (
            <Link href="?" className="h-10 content-center text-sm text-muted-foreground underline">
              Ver todas
            </Link>
          ) : null}
        </form>

        {errorDeBusqueda ? (
          <p role="alert" className="text-sm text-destructive">
            {errorDeBusqueda}
          </p>
        ) : null}

        {resultado ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
            <p className="border-b border-border px-5 py-3.5 text-sm text-muted-foreground">
              <strong className="text-foreground">{resultado.total} postulación(es)</strong> · página{' '}
              {resultado.pagina} de {resultado.totalPaginas}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-muted/50 text-xs tracking-wide text-muted-foreground uppercase">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Número</th>
                    <th className="px-5 py-3 font-semibold">Estado</th>
                    <th className="px-5 py-3 font-semibold">Vence el</th>
                    <th className="px-5 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.items.map((postulacion) => {
                    const operable =
                      postulacion.estado === 'PAGO_PENDIENTE' || postulacion.estado === 'VENCIDO'
                    const vencimiento =
                      operable && postulacion.venceEl ? describirVencimiento(postulacion.venceEl, ahora) : null

                    return (
                      <tr
                        key={postulacion.id}
                        className={cn(
                          'border-t border-border align-middle',
                          vencimiento?.urgencia === 'proximo' && 'bg-accent/40',
                        )}
                      >
                        <td className="px-5 py-4">
                          <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-semibold">
                            Nº {postulacion.numero}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <InsigniaDePostulacion estado={postulacion.estado} />
                        </td>
                        <td className="px-5 py-4">
                          {postulacion.venceEl ? (
                            <span className="flex flex-col">
                              <span>{formatearFecha(postulacion.venceEl)}</span>
                              {vencimiento ? (
                                <span
                                  className={cn(
                                    'text-xs',
                                    vencimiento.urgencia === 'normal' && 'text-muted-foreground',
                                    vencimiento.urgencia === 'proximo' && 'font-semibold text-accent-foreground',
                                    vencimiento.urgencia === 'vencido' && 'text-destructive',
                                  )}
                                >
                                  {vencimiento.texto}
                                </span>
                              ) : null}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {operable ? (
                            <div className="flex flex-wrap items-start justify-end gap-3">
                              <FormularioDeAccion
                                accion={acreditarPagoAccion}
                                ocultos={{ id: postulacion.id }}
                                etiqueta="Acreditar pago"
                                icono={<Check aria-hidden="true" />}
                              />
                              <FormularioDeAccion
                                accion={prorrogarPlazoAccion}
                                ocultos={{ id: postulacion.id }}
                                etiqueta="Prorrogar"
                                variante="outline"
                              >
                                <label className="flex h-8 items-center gap-1.5 text-xs text-muted-foreground">
                                  <span className="sr-only">Días de prórroga</span>
                                  <input
                                    name="dias"
                                    type="number"
                                    min={1}
                                    max={365}
                                    defaultValue={7}
                                    className="h-8 w-16 rounded-lg border border-input bg-background px-2 text-center text-sm"
                                  />
                                  días
                                </label>
                              </FormularioDeAccion>
                            </div>
                          ) : (
                            <span className="block text-right text-xs text-muted-foreground">
                              Sin acciones disponibles
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {resultado.items.length === 0 ? (
                    <tr className="border-t border-border">
                      <td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">
                        No hay postulaciones para mostrar.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {resultado.totalPaginas > 1 ? (
              <nav aria-label="Paginación" className="flex justify-end gap-2 border-t border-border px-5 py-3">
                {resultado.pagina > 1 ? (
                  <Link href={enlace(resultado.pagina - 1)} className={ESTILO_DE_PAGINA}>
                    Anterior
                  </Link>
                ) : null}
                {resultado.pagina < resultado.totalPaginas ? (
                  <Link href={enlace(resultado.pagina + 1)} className={ESTILO_DE_PAGINA}>
                    Siguiente
                  </Link>
                ) : null}
              </nav>
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  )
}
