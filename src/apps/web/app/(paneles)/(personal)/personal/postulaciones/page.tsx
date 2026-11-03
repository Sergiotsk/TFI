import Link from 'next/link'
import { Check, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { EncabezadoDePanel } from '@/components/panel/encabezado-de-panel'
import { FormularioDeAccion } from '@/components/panel/formulario-de-accion'
import { describirVencimiento, formatearFecha } from '@/components/panel/formato'
import { InsigniaDePostulacion } from '@/components/panel/insignia-de-estado'
import { cn } from '@/lib/utils'
import { conActorDePanel, mensajeDeError } from '../../../sesion-de-panel'
import { acreditarPagoAccion, prorrogarPlazoAccion } from './actions'
import { esquemaBusquedaDeDni, esquemaPaginaDeSeguimiento, esquemaPeriodoDeSeguimiento } from './esquemas'
import type { Pagina, PostulacionConsultada } from '@tfi/application'

const POR_PAGINA = 20
// Cuántos números de página se muestran alrededor de la actual.
const PAGINAS_VISIBLES = 5
const ESTILO_DE_CAMPO =
  'h-11 w-full rounded-[3px] border border-input bg-card px-3 text-[15px] font-normal text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
const ESTILO_DE_PAGINA = 'flex size-11 items-center justify-center border border-border bg-card hover:bg-accent'

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
  const periodoId = esquemaPeriodoDeSeguimiento.parse(primero(consulta.periodo) || undefined)
  const dni = dniIngresado ? esquemaBusquedaDeDni.safeParse(dniIngresado) : null

  let errorDeBusqueda: string | null =
    dni && !dni.success ? (dni.error.issues[0]?.message ?? 'DNI inválido') : null
  let resultado: Pagina<PostulacionConsultada> | null = null
  let periodos: { id: string; nombre: string }[] = []

  try {
    ;[periodos, resultado] = await conActorDePanel(
      async ({ buscarPostulacionesPorDni, listarPostulaciones, listarPeriodosTodos }, actor) => {
        const paginacion = { pagina, porPagina: POR_PAGINA }
        const todos = await listarPeriodosTodos.ejecutar(actor, { pagina: 1, porPagina: 100 })
        const opciones = todos.items.map(({ id, nombre }) => ({ id, nombre }))

        if (dni && !dni.success) return [opciones, null] as const
        return [
          opciones,
          dni?.success
            ? await buscarPostulacionesPorDni.ejecutar(actor, dni.data, periodoId, paginacion)
            : await listarPostulaciones.ejecutar(actor, { periodoId }, paginacion),
        ] as const
      },
    )
  } catch (error) {
    errorDeBusqueda = mensajeDeError(error)
  }

  const ahora = new Date()
  const filtrado = Boolean(dniIngresado || periodoId)
  const enlace = (destino: number) =>
    `?${new URLSearchParams({
      ...(dniIngresado ? { dni: dniIngresado } : {}),
      ...(periodoId ? { periodo: periodoId } : {}),
      pagina: String(destino),
    })}`

  return (
    <div className="min-h-screen text-foreground">
      <EncabezadoDePanel
        area="Personal de la TUP"
        titulo="Postulaciones"
        descripcion="Buscá por DNI, acreditá pagos verificados fuera del sistema o prorrogá el plazo de pago."
      />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <form method="get" className="flex flex-wrap items-end gap-4 bg-card p-5 shadow-(--sombra-tarjeta)">
          <label className="flex flex-[2_1_260px] flex-col gap-1.5 text-[13px] font-semibold text-primary">
            DNI del aspirante
            <span className="relative block">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-input"
              />
              <input
                name="dni"
                type="search"
                defaultValue={dniIngresado}
                inputMode="numeric"
                placeholder="Todas las postulaciones"
                className={cn(ESTILO_DE_CAMPO, 'pl-9')}
              />
            </span>
          </label>
          <label className="flex flex-[1_1_200px] flex-col gap-1.5 text-[13px] font-semibold text-primary">
            Período
            <select name="periodo" defaultValue={periodoId ?? ''} className={ESTILO_DE_CAMPO}>
              <option value="">Todos los períodos</option>
              {periodos.map(({ id, nombre }) => (
                <option key={id} value={id}>
                  {nombre}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-4">
            <button
              type="submit"
              className="h-11 bg-primary px-6 text-[15px] font-medium text-primary-foreground hover:bg-primary/90"
            >
              Buscar
            </button>
            {filtrado ? (
              <Link href="?" className="text-sm font-semibold text-primary underline">
                Ver todas
              </Link>
            ) : null}
          </div>
        </form>

        {errorDeBusqueda ? (
          <p role="alert" className="text-sm text-destructive">
            {errorDeBusqueda}
          </p>
        ) : null}

        {resultado ? (
          <>
            <div className="overflow-x-auto bg-card shadow-(--sombra-tarjeta)">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-muted text-xs tracking-[0.6px] text-primary uppercase">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-extrabold">
                      Número
                    </th>
                    <th scope="col" className="px-4 py-3 font-extrabold">
                      Estado
                    </th>
                    <th scope="col" className="px-4 py-3 font-extrabold">
                      Vence el pago
                    </th>
                    <th scope="col" className="px-5 py-3 text-right font-extrabold">
                      Acciones
                    </th>
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
                          vencimiento?.urgencia === 'proximo' && 'bg-accent/50',
                        )}
                      >
                        <td className="px-5 py-3 font-semibold text-primary">Nº {postulacion.numero}</td>
                        <td className="px-4 py-3">
                          <InsigniaDePostulacion estado={postulacion.estado} />
                        </td>
                        <td className="px-4 py-3">
                          {postulacion.venceEl ? (
                            <span className="flex flex-col">
                              <span>{formatearFecha(postulacion.venceEl)}</span>
                              {vencimiento ? (
                                <span
                                  className={cn(
                                    'text-[13px]',
                                    vencimiento.urgencia === 'proximo' && 'font-semibold text-primary',
                                    vencimiento.urgencia === 'vencido' && 'font-semibold text-destructive',
                                  )}
                                >
                                  {vencimiento.texto}
                                </span>
                              ) : null}
                            </span>
                          ) : (
                            <span>—</span>
                          )}
                        </td>
                        <td className="px-5 py-2">
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
                                <label className="flex h-11 items-center gap-1.5 text-[13px]">
                                  <span className="sr-only">Días de prórroga</span>
                                  <input
                                    name="dias"
                                    type="number"
                                    min={1}
                                    max={365}
                                    defaultValue={7}
                                    className="h-11 w-16 rounded-[3px] border border-input bg-card px-2 text-center text-[15px]"
                                  />
                                  días
                                </label>
                              </FormularioDeAccion>
                            </div>
                          ) : (
                            <span className="block text-right text-[13px]">Sin acciones disponibles</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {resultado.items.length === 0 ? (
                    <tr className="border-t border-border">
                      <td colSpan={4} className="px-5 py-10 text-center">
                        No hay postulaciones para mostrar.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <span>{describirRango(resultado.pagina, resultado.total)}</span>
              {resultado.totalPaginas > 1 ? (
                <nav aria-label="Paginación" className="flex gap-1">
                  {resultado.pagina > 1 ? (
                    <Link href={enlace(resultado.pagina - 1)} aria-label="Página anterior" className={ESTILO_DE_PAGINA}>
                      <ChevronLeft aria-hidden="true" className="size-4" />
                    </Link>
                  ) : null}
                  {paginasVisibles(resultado.pagina, resultado.totalPaginas).map((numero) =>
                    numero === resultado.pagina ? (
                      <span
                        key={numero}
                        aria-current="page"
                        className="flex size-11 items-center justify-center bg-primary font-bold text-primary-foreground"
                      >
                        {numero}
                      </span>
                    ) : (
                      <Link key={numero} href={enlace(numero)} className={ESTILO_DE_PAGINA}>
                        {numero}
                      </Link>
                    ),
                  )}
                  {resultado.pagina < resultado.totalPaginas ? (
                    <Link
                      href={enlace(resultado.pagina + 1)}
                      aria-label="Página siguiente"
                      className={ESTILO_DE_PAGINA}
                    >
                      <ChevronRight aria-hidden="true" className="size-4" />
                    </Link>
                  ) : null}
                </nav>
              ) : null}
            </div>
          </>
        ) : null}
      </main>
    </div>
  )
}

// "Mostrando 21–40 de 48 postulaciones".
function describirRango(pagina: number, total: number): string {
  if (total === 0) return 'Sin postulaciones'
  const desde = (pagina - 1) * POR_PAGINA + 1
  const hasta = Math.min(pagina * POR_PAGINA, total)
  return `Mostrando ${desde}–${hasta} de ${total} ${total === 1 ? 'postulación' : 'postulaciones'}`
}

// Ventana de números de página centrada en la actual, sin pasarse de los bordes.
function paginasVisibles(actual: number, total: number): number[] {
  const cantidad = Math.min(PAGINAS_VISIBLES, total)
  const desde = Math.min(Math.max(1, actual - Math.floor(cantidad / 2)), total - cantidad + 1)
  return Array.from({ length: cantidad }, (_, indice) => desde + indice)
}
