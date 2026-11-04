import Link from 'next/link'
import { EncabezadoDePanel } from '@/components/panel/encabezado-de-panel'
import { BotonPagarMercadoPago } from '@/components/panel/boton-pagar-mercado-pago'
import { CorregirDocumento } from '@/components/panel/corregir-documento'
import { FormularioDeAccion } from '@/components/panel/formulario-de-accion'
import { formatearFecha } from '@/components/panel/formato'
import { InsigniaDePostulacion } from '@/components/panel/insignia-de-estado'
import { buttonVariants } from '@/components/ui/button'
import { conActorDePanel } from '../../sesion-de-panel'
import { iniciarPagoAccion } from './actions'
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
                {periodos.map((periodo: PeriodoDeIngreso) => (
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
                    <Link
                      href={`/aspirante/postulacion/requisitos?periodo=${periodo.id}`}
                      className={buttonVariants()}
                    >
                      Ver condiciones e inscribirme
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        {postulaciones.map((postulacion: PostulacionConsultada) => (
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

            {/* El vencimiento se conserva después del pago (auditoría), pero al aspirante solo le sirve mientras
                tiene que pagar o si el plazo ya se le pasó. */}
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

            {/* La Postulación no guarda por qué medio eligió pagar: el texto cubre los dos. No se ofrece el botón
                de MP acá: con el webhook demorado, quien ya pagó podría pagar dos veces. */}
            {postulacion.estado === 'PAGO_PENDIENTE' ? (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">En ventanilla:</strong> pagá en la caja de la facultad antes de
                  la fecha límite, con tu DNI y tu número de postulación{' '}
                  <strong className="font-mono text-foreground">Nº {postulacion.numero}</strong>. Tesorería acredita
                  los pagos de la caja con el informe del día, así que la vacante confirmada puede tardar hasta un día
                  hábil en verse acá.
                </p>
                <p>
                  <strong className="text-foreground">Con Mercado Pago:</strong> si ya pagaste, en unos instantes vas
                  a ver tu vacante confirmada acá.
                </p>
              </div>
            ) : null}

            {postulacion.estado === 'VACANTE_CONFIRMADA' ? (
              <div className="space-y-3">
                <div className="space-y-1 border-l-4 border-[var(--senal-verde)] bg-accent p-4 text-sm text-foreground">
                  <p className="font-bold">Tu pago fue acreditado y tu vacante está confirmada.</p>
                  <p className="text-xs text-muted-foreground">
                    Ahora disponés de 10 días hábiles para presentar la totalidad de la documentación requerida.
                  </p>
                </div>
                <Link
                  href="/aspirante/postulacion/documentacion"
                  className={buttonVariants({ size: 'lg' })}
                >
                  Cargar documentación
                </Link>
              </div>
            ) : null}

            {postulacion.estado === 'ESPERANDO_DOCUMENTACION' ? (
              <p className="border-l-4 border-primary bg-accent p-4 text-sm text-foreground">
                Recibimos tu documentación. La Secretaría la va a revisar y vas a ver el resultado acá.
              </p>
            ) : null}

            {postulacion.estado === 'OBSERVADO' ? (
              (observados.get(postulacion.id) ?? []).length === 0 ? (
                <p className="border-l-4 border-primary bg-accent p-4 text-sm text-foreground">
                  Recibimos tus correcciones. La Secretaría las va a revisar y vas a ver el resultado acá.
                </p>
              ) : (
                <div className="space-y-3 border-l-4 border-destructive bg-destructive/5 p-4">
                  <p className="text-sm font-bold text-destructive">
                    La Secretaría observó documentación. Corregí estos documentos:
                  </p>
                  <ul className="space-y-4">
                    {(observados.get(postulacion.id) ?? []).map((documento) => (
                      <li key={documento.id} className="space-y-2">
                        <span className="block text-sm font-semibold text-foreground">
                          {documento.tipo} · {documento.nombreArchivo}
                        </span>
                        <span className="block text-xs text-muted-foreground">
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
              <div className="space-y-2 border-l-4 border-[var(--senal-verde)] bg-accent p-4 text-sm text-foreground">
                <p className="font-bold">Tu documentación fue validada. ¡Tu inscripción está completa!</p>
                <p className="text-xs text-muted-foreground">
                  En los próximos días, el personal de la UTN se va a comunicar con vos al correo electrónico que
                  registraste en este proceso para enviarte los datos de acceso al sistema de alumnos de la facultad.
                </p>
              </div>
            ) : null}

            {postulacion.estado === 'PREINSCRIPTO' || postulacion.estado === 'VENCIDO' ? (
              <div className="space-y-4">
                <p className="border-l-4 border-[var(--senal-ambar)] bg-card shadow-(--sombra-tarjeta) p-4 text-sm text-foreground">
                  El pago es una <strong>seña que reserva tu vacante</strong>. Al iniciarlo tenés un plazo para
                  completarlo, que vas a ver acá; si vence, el cupo se libera. Con el pago acreditado, tenés 10 días
                  hábiles para cargar la documentación.
                </p>
                <p className="text-sm text-muted-foreground">
                  Podés pagar en línea con Mercado Pago o en la caja de la facultad. Si vas a la caja, iniciá el
                  pago acá antes: así arranca tu plazo y Tesorería puede imputar tu pago con el informe del día.
                </p>
                <div className="flex flex-wrap items-start gap-3">
                  <BotonPagarMercadoPago postulacionId={postulacion.id} />
                  <FormularioDeAccion
                    accion={iniciarPagoAccion}
                    ocultos={{ id: postulacion.id }}
                    etiqueta="Pagar en ventanilla"
                    variante="outline"
                    tamano="lg"
                  />
                </div>
              </div>
            ) : null}
          </section>
        ))}
      </main>
    </div>
  )
}
