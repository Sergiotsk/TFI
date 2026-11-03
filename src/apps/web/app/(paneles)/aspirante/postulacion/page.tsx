import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { EncabezadoDePanel } from '@/components/panel/encabezado-de-panel'
import { FormularioDeAccion } from '@/components/panel/formulario-de-accion'
import { formatearFecha } from '@/components/panel/formato'
import { InsigniaDePostulacion } from '@/components/panel/insignia-de-estado'
import { conActorDePanel } from '../../sesion-de-panel'
import { crearPostulacionAccion, iniciarPagoAccion } from './actions'

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
    <div>
      <EncabezadoDePanel
        area="Aspirante"
        titulo="Mi postulación"
        descripcion="Seguí el estado de tu postulación de ingreso."
      />

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {postulaciones.length === 0 ? (
          <section className="space-y-4 bg-card p-6 shadow-(--sombra-tarjeta)">
            <h2 className="text-base font-semibold text-foreground">Todavía no tenés una postulación</h2>
            {periodos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay períodos de ingreso abiertos por ahora.</p>
            ) : (
              <ul className="space-y-3">
                {periodos.map((periodo) => (
                  <li
                    key={periodo.id}
                    className="flex flex-col gap-3 border-b border-border pb-4 last:border-none sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <span className="block text-sm font-semibold text-foreground">{periodo.nombre}</span>
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

        {postulaciones.map((postulacion) => (
          <section
            key={postulacion.id}
            className="space-y-6 bg-card p-6 shadow-(--sombra-tarjeta)"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="block text-xs font-medium text-muted-foreground">Número de postulación</span>
                <span className="font-mono text-xl font-bold tracking-wider text-primary">Nº {postulacion.numero}</span>
              </div>
              <InsigniaDePostulacion estado={postulacion.estado} />
            </div>

            {postulacion.venceEl &&
            (postulacion.estado === 'PAGO_PENDIENTE' || postulacion.estado === 'VENCIDO') ? (
              <div>
                <span className="block text-xs font-medium text-muted-foreground">
                  {postulacion.estado === 'VENCIDO' ? 'El plazo para pagar venció el' : 'Fecha límite para pagar'}
                </span>
                <span className="text-base font-semibold text-foreground">{formatearFecha(postulacion.venceEl)}</span>
              </div>
            ) : null}

            {postulacion.aviso ? (
              <p className="bg-accent p-4 text-sm text-accent-foreground">
                {postulacion.aviso}
              </p>
            ) : null}

            {postulacion.estado === 'PAGO_PENDIENTE' ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Tu postulación está pendiente de pago. Podés abonar la seña oficial en línea para reservar tu lugar en la carrera.
                </p>
                <Link
                  href="/aspirante/postulacion/pago"
                  className={buttonVariants({ size: 'lg' })}
                >
                  Ir a pagar seña
                </Link>
              </div>
            ) : null}

            {postulacion.estado === 'VACANTE_CONFIRMADA' ? (
              <p className="border-l-4 border-[var(--senal-verde)] bg-accent p-4 text-sm font-medium text-foreground">
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