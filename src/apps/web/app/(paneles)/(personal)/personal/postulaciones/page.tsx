import Link from 'next/link'
import { EncabezadoDePanel } from '@/components/panel/encabezado-de-panel'
import { FormularioDeAccion } from '@/components/panel/formulario-de-accion'
import { formatearFecha } from '@/components/panel/formato'
import { InsigniaDePostulacion } from '@/components/panel/insignia-de-estado'
import { conActorDePanel, mensajeDeError } from '../../../sesion-de-panel'
import { acreditarPagoAccion, prorrogarPlazoAccion } from './actions'
import { esquemaBusquedaDeDni, esquemaPaginaDeSeguimiento } from './esquemas'
import type { Pagina, PostulacionConsultada } from '@tfi/application'

const POR_PAGINA = 20

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
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="space-y-1 text-xs">
            <span className="block text-muted-foreground">DNI del aspirante</span>
            <input
              name="dni"
              defaultValue={dniIngresado}
              inputMode="numeric"
              placeholder="Todas las postulaciones"
              className="h-9 w-56 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </label>
          <button
            type="submit"
            className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Buscar
          </button>
          {dniIngresado ? (
            <Link href="?" className="text-sm text-muted-foreground underline">
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
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {resultado.total} postulación(es) · página {resultado.pagina} de {resultado.totalPaginas}
            </p>
            <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-border text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Número</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Vence el</th>
                    <th className="px-4 py-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.items.map((postulacion) => {
                    const operable =
                      postulacion.estado === 'PAGO_PENDIENTE' || postulacion.estado === 'VENCIDO'

                    return (
                      <tr key={postulacion.id} className="border-b border-border align-top last:border-0">
                        <td className="px-4 py-3 font-mono text-xs">Nº {postulacion.numero}</td>
                        <td className="px-4 py-3">
                          <InsigniaDePostulacion estado={postulacion.estado} />
                        </td>
                        <td className="px-4 py-3">
                          {postulacion.venceEl ? formatearFecha(postulacion.venceEl) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {operable ? (
                            <div className="flex flex-col gap-3">
                              <FormularioDeAccion
                                accion={acreditarPagoAccion}
                                ocultos={{ id: postulacion.id }}
                                etiqueta="Acreditar pago"
                                tamano="sm"
                              />
                              <FormularioDeAccion
                                accion={prorrogarPlazoAccion}
                                ocultos={{ id: postulacion.id }}
                                etiqueta="Prorrogar plazo"
                                variante="outline"
                                tamano="sm"
                              >
                                <label className="text-xs text-muted-foreground">
                                  <span className="sr-only">Días de prórroga</span>
                                  <input
                                    name="dias"
                                    type="number"
                                    min={1}
                                    max={365}
                                    defaultValue={7}
                                    className="h-7 w-16 rounded-lg border border-input bg-background px-2 text-sm"
                                  />{' '}
                                  días
                                </label>
                              </FormularioDeAccion>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin acciones disponibles</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {resultado.items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                        No hay postulaciones para mostrar.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <nav aria-label="Paginación" className="flex gap-4 text-sm">
              {resultado.pagina > 1 ? <Link href={enlace(resultado.pagina - 1)}>Anterior</Link> : null}
              {resultado.pagina < resultado.totalPaginas ? (
                <Link href={enlace(resultado.pagina + 1)}>Siguiente</Link>
              ) : null}
            </nav>
          </div>
        ) : null}
      </main>
    </div>
  )
}
