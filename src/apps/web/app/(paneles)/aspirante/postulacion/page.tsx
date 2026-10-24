import { EncabezadoDePanel } from '@/components/panel/encabezado-de-panel'
import { FormularioDeAccion } from '@/components/panel/formulario-de-accion'
import { formatearFecha } from '@/components/panel/formato'
import { InsigniaDePostulacion } from '@/components/panel/insignia-de-estado'
import { conActorDePanel } from '../../sesion-de-panel'
import { crearPostulacionAccion, iniciarPagoAccion } from './actions'
import type { PeriodoDeIngreso } from '@tfi/domain'
import type { PostulacionConsultada } from '@tfi/application'

// Panel del aspirante conectado a los casos de uso: ConsultarPostulacion.listarMias, ListarPeriodosAbiertos,
// CrearPostulacion e IniciarPago. Sin pasarela de pago: la acreditación la hace el personal.
export default async function PostulacionDelAspirantePage() {
  const { postulaciones, periodos } = await conActorDePanel(
    async ({ consultarPostulacion, listarPeriodosAbiertos }, actor) => {
      const propias = await consultarPostulacion.listarMias(actor)

      return {
        postulaciones: propias,
        periodos: propias.length === 0 ? await listarPeriodosAbiertos.ejecutar(actor) : [],
      }
    },
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <EncabezadoDePanel
        area="Aspirante"
        titulo="Mi postulación"
        descripcion="Seguí el estado de tu postulación de ingreso."
      />

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {postulaciones.length === 0 ? (
          <section className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-xs">
            <h2 className="text-base font-semibold">Todavía no tenés una postulación</h2>
            {periodos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay períodos de ingreso abiertos por ahora.</p>
            ) : (
              <ul className="space-y-3">
                {periodos.map((periodo: PeriodoDeIngreso) => (
                  <li
                    key={periodo.id}
                    className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <span className="block text-sm font-semibold">{periodo.nombre}</span>
                      <span className="block text-xs text-muted-foreground">
                        Cierra el {formatearFecha(periodo.cierraEl)}
                      </span>
                    </div>
                    <FormularioDeAccion
                      accion={crearPostulacionAccion}
                      ocultos={{ periodoId: periodo.id }}
                      etiqueta="Iniciar postulación"
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        {postulaciones.map((postulacion: PostulacionConsultada) => (
          <section
            key={postulacion.id}
            className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-xs"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="block text-xs font-medium text-muted-foreground">Número de postulación</span>
                <span className="font-mono text-xl font-bold tracking-wider">Nº {postulacion.numero}</span>
              </div>
              <InsigniaDePostulacion estado={postulacion.estado} />
            </div>

            {/* El vencimiento se conserva después del pago (auditoría), pero al aspirante solo le sirve mientras
                tiene que pagar o si el plazo ya se le pasó. */}
            {postulacion.venceEl &&
            (postulacion.estado === 'PAGO_PENDIENTE' || postulacion.estado === 'VENCIDO') ? (
              <div>
                <span className="block text-xs font-medium text-muted-foreground">
                  {postulacion.estado === 'VENCIDO' ? 'El plazo para pagar venció el' : 'Fecha límite para pagar'}
                </span>
                <span className="text-base font-semibold">{formatearFecha(postulacion.venceEl)}</span>
              </div>
            ) : null}

            {postulacion.aviso ? (
              <p className="rounded-lg border border-secondary/30 bg-accent p-4 text-sm text-accent-foreground">
                {postulacion.aviso}
              </p>
            ) : null}

            {postulacion.estado === 'PAGO_PENDIENTE' ? (
              <p className="text-sm text-muted-foreground">
                Pagá la matrícula en la facultad o por el medio indicado antes de la fecha límite. No hay pago en
                línea: el personal acredita tu pago y vas a ver la vacante confirmada acá.
              </p>
            ) : null}

            {postulacion.estado === 'VACANTE_CONFIRMADA' ? (
              <p className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
                Tu pago fue acreditado y tu vacante está confirmada.
              </p>
            ) : null}

            {postulacion.estado === 'PREINSCRIPTO' || postulacion.estado === 'VENCIDO' ? (
              <FormularioDeAccion
                accion={iniciarPagoAccion}
                ocultos={{ id: postulacion.id }}
                etiqueta="Iniciar pago"
                tamano="lg"
              />
            ) : null}
          </section>
        ))}
      </main>
    </div>
  )
}
