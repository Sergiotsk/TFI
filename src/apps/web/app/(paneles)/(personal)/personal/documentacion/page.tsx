import { EncabezadoDePanel } from '@/components/panel/encabezado-de-panel'
import { FormularioDeAccion } from '@/components/panel/formulario-de-accion'
import { formatearFecha } from '@/components/panel/formato'
import { InsigniaDePostulacion } from '@/components/panel/insignia-de-estado'
import { conActorDePanel, mensajeDeError } from '../../../sesion-de-panel'
import { revisarDocumentoAccion } from './actions'
import type { Documento, EstadoDocumento, EstadoPostulacion } from '@tfi/domain'
import type { PostulacionConsultada } from '@tfi/application'

// Las etapas de la Postulación en las que hay documentación para revisar.
const ETAPAS_DE_DOCUMENTACION: readonly EstadoPostulacion[] = [
  'ESPERANDO_DOCUMENTACION',
  'DOCUMENTACION_EN_REVISION',
  'OBSERVADO',
  'DOCUMENTACION_VALIDADA',
]

const PAGINA_COMPLETA = { pagina: 1, porPagina: 50 }

const ESTILO_DE_DOCUMENTO: Record<EstadoDocumento, string> = {
  PENDIENTE: 'border-border text-muted-foreground',
  APROBADO: 'border-primary/30 bg-primary/10 text-primary',
  OBSERVADO: 'border-destructive/30 bg-destructive/10 text-destructive',
}

interface PostulacionConDocumentos {
  postulacion: PostulacionConsultada
  documentos: Documento[]
}

// Revisión de documentación (Secretaría y Dirección): ListarPostulaciones por etapa, ListarDocumentos de cada una,
// ConsultarDocumento para abrir el archivo y RevisarDocumento para aprobar u observar.
export default async function DocumentacionDelPersonalPage() {
  let bandeja: PostulacionConDocumentos[] = []
  let error: string | null = null

  try {
    bandeja = await conActorDePanel(async ({ listarPostulaciones, listarDocumentos }, actor) => {
      const porEtapa = await Promise.all(
        ETAPAS_DE_DOCUMENTACION.map((estado) =>
          listarPostulaciones.ejecutar(actor, { estado }, PAGINA_COMPLETA),
        ),
      )
      const postulaciones = porEtapa.flatMap((pagina) => pagina.items)

      return Promise.all(
        postulaciones.map(async (postulacion: PostulacionConsultada) => ({
          postulacion,
          documentos: (
            await listarDocumentos.ejecutar(actor, { postulacionId: postulacion.id }, PAGINA_COMPLETA)
          ).items,
        })),
      )
    })
  } catch (causa) {
    error = mensajeDeError(causa)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <EncabezadoDePanel
        area="Personal de la TUP"
        titulo="Documentación"
        descripcion="Abrí los documentos que subieron los aspirantes y aprobalos u observalos con un motivo."
      />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {!error && bandeja.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay documentación para revisar.</p>
        ) : null}

        {bandeja.map(({ postulacion, documentos }) => (
          <section
            key={postulacion.id}
            className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-xs"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-mono text-lg font-bold tracking-wider">Nº {postulacion.numero}</span>
              <InsigniaDePostulacion estado={postulacion.estado} />
            </div>

            {documentos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no subió documentos.</p>
            ) : (
              <ul className="divide-y divide-border">
                {documentos.map((documento) => (
                  <li key={documento.id} className="space-y-3 py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-semibold">{documento.tipo}</span>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-xs font-medium ${ESTILO_DE_DOCUMENTO[documento.estado]}`}
                      >
                        {documento.estado}
                      </span>
                      <a
                        href={`/personal/documentacion/${documento.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary underline"
                      >
                        Ver {documento.nombreArchivo}
                      </a>
                      <span className="text-xs text-muted-foreground">
                        Subido el {formatearFecha(documento.creadoEl)}
                      </span>
                    </div>

                    {documento.observaciones ? (
                      <p className="text-xs text-muted-foreground">Observación: {documento.observaciones}</p>
                    ) : null}

                    {postulacion.estado !== 'DOCUMENTACION_VALIDADA' ? (
                      <div className="flex flex-wrap items-end gap-4">
                        {documento.estado !== 'APROBADO' ? (
                          <FormularioDeAccion
                            accion={revisarDocumentoAccion}
                            ocultos={{ id: documento.id, estado: 'APROBADO' }}
                            etiqueta="Aprobar"
                          />
                        ) : null}
                        {documento.estado !== 'OBSERVADO' ? (
                          <FormularioDeAccion
                            accion={revisarDocumentoAccion}
                            ocultos={{ id: documento.id, estado: 'OBSERVADO' }}
                            etiqueta="Observar"
                            variante="outline"
                          >
                            <input
                              name="observaciones"
                              required
                              placeholder="Motivo de la observación"
                              className="h-9 w-64 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                            />
                          </FormularioDeAccion>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </main>
    </div>
  )
}
