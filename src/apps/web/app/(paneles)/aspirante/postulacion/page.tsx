import Link from 'next/link'
import { EncabezadoDePanel } from '@/components/panel/encabezado-de-panel'
import { BotonPagarMercadoPago } from '@/components/panel/boton-pagar-mercado-pago'
import { CorregirDocumento } from '@/components/panel/corregir-documento'
import { FormularioDeAccion } from '@/components/panel/formulario-de-accion'
import { formatearFecha } from '@/components/panel/formato'
import { InsigniaDePostulacion } from '@/components/panel/insignia-de-estado'
import { buttonVariants } from '@/components/ui/button'
import { conActorDePanel } from '../../sesion-de-panel'
import { crearPostulacionAccion } from './actions'
import type { Documento, PeriodoDeIngreso } from '@tfi/domain'
import type { PostulacionConsultada } from '@tfi/application'

// Panel del aspirante conectado a los casos de uso: ConsultarPostulacion.listarMias, ListarPeriodosAbiertos y
// CrearPostulacion. Demo: el pago se inicia con Mercado Pago y el webhook confirma la vacante; si no llega,
// el personal acredita el pago a mano.
export default async function PostulacionDelAspirantePage() {
  const { postulaciones, periodos, observados } = await conActorDePanel(
    async ({ consultarPostulacion, listarPeriodosAbiertos, listarDocumentos }, actor) => {
      const propias: PostulacionConsultada[] = await consultarPostulacion.listarMias(actor)

      // Los documentos observados de cada Postulación OBSERVADO, para mostrar el motivo y corregirlos.
      const observados = new Map<string, Documento[]>()
      for (const postulacion of propias.filter((p) => p.estado === 'OBSERVADO')) {
        const pagina = await listarDocumentos.ejecutar(
          actor,
          { postulacionId: postulacion.id, estado: 'OBSERVADO' },
          { pagina: 1, porPagina: 50 },
        )
        observados.set(postulacion.id, pagina.items)
      }

      return {
        postulaciones: propias,
        periodos: propias.length === 0 ? await listarPeriodosAbiertos.ejecutar(actor) : [],
        observados,
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
                Estamos esperando la confirmación de Mercado Pago. Si ya pagaste, en unos instantes vas a ver tu
                vacante confirmada acá.
              </p>
            ) : null}

            {postulacion.estado === 'VACANTE_CONFIRMADA' ? (
              <p className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
                Tu pago fue acreditado y tu vacante está confirmada.
              </p>
            ) : null}

            {postulacion.estado === 'ESPERANDO_DOCUMENTACION' ? (
              <p className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
                Recibimos tu documentación. La Secretaría la va a revisar y vas a ver el resultado acá.
              </p>
            ) : null}

            {postulacion.estado === 'OBSERVADO' ? (
              (observados.get(postulacion.id) ?? []).length === 0 ? (
                <p className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
                  Recibimos tus correcciones. La Secretaría las va a revisar y vas a ver el resultado acá.
                </p>
              ) : (
                <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-sm font-semibold text-destructive">
                    La Secretaría observó documentación. Corregí estos documentos:
                  </p>
                  <ul className="space-y-4">
                    {(observados.get(postulacion.id) ?? []).map((documento) => (
                      <li key={documento.id} className="space-y-2">
                        <span className="block text-sm font-medium">
                          {documento.tipo} · {documento.nombreArchivo}
                        </span>
                        <span className="block text-sm text-muted-foreground">
                          Motivo: {documento.observaciones}
                        </span>
                        <CorregirDocumento
                          postulacionId={postulacion.id}
                          documentoId={documento.id}
                          tipo={documento.tipo}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ) : null}

            {postulacion.estado === 'DOCUMENTACION_EN_REVISION' ? (
              <p className="text-sm text-muted-foreground">
                La Secretaría está revisando tu documentación.
              </p>
            ) : null}

            {postulacion.estado === 'DOCUMENTACION_VALIDADA' ? (
              <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
                <p className="font-semibold">Tu documentación fue validada. ¡Tu inscripción está completa!</p>
                <p>
                  En los próximos días, el personal de la UTN se va a comunicar con vos al correo electrónico que
                  registraste en este proceso para enviarte los datos de acceso al sistema de alumnos de la facultad.
                </p>
              </div>
            ) : null}

            {postulacion.estado === 'VACANTE_CONFIRMADA' ? (
              <Link
                href="/aspirante/postulacion/documentacion"
                className={buttonVariants({ size: 'lg' })}
              >
                Cargar documentación
              </Link>
            ) : null}

            {postulacion.estado === 'PREINSCRIPTO' || postulacion.estado === 'VENCIDO' ? (
              <BotonPagarMercadoPago postulacionId={postulacion.id} />
            ) : null}
          </section>
        ))}
      </main>
    </div>
  )
}
