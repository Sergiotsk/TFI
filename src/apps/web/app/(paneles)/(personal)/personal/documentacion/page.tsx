import { FileCheck, FileText, FileWarning, type LucideIcon } from 'lucide-react'
import { EncabezadoDePanel } from '@/components/panel/encabezado-de-panel'
import { EstadoVacio } from '@/components/panel/estado-vacio'
import { FormularioDeAccion } from '@/components/panel/formulario-de-accion'
import { formatearFecha, porcentaje } from '@/components/panel/formato'
import { InsigniaDePostulacion } from '@/components/panel/insignia-de-estado'
import { cn } from '@/lib/utils'
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
  PENDIENTE: 'border-border bg-muted text-muted-foreground',
  APROBADO: 'border-primary/30 bg-primary/10 text-primary',
  OBSERVADO: 'border-destructive/30 bg-destructive/10 text-destructive',
}

const PRESENTACION_DE_DOCUMENTO: Record<EstadoDocumento, { etiqueta: string; icono: LucideIcon; caja: string }> = {
  PENDIENTE: { etiqueta: 'Pendiente', icono: FileText, caja: 'bg-accent text-accent-foreground' },
  APROBADO: { etiqueta: 'Aprobado', icono: FileCheck, caja: 'bg-primary/10 text-primary' },
  OBSERVADO: { etiqueta: 'Observado', icono: FileWarning, caja: 'bg-destructive/10 text-destructive' },
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
          <EstadoVacio
            icono={FileCheck}
            titulo="No hay documentación para revisar"
            descripcion="Cuando un aspirante suba sus documentos, van a aparecer acá para aprobarlos u observarlos."
          />
        ) : null}

        {bandeja.map(({ postulacion, documentos }) => {
          const aprobados = documentos.filter((documento) => documento.estado === 'APROBADO').length

          return (
            <section
              key={postulacion.id}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs"
            >
              <div className="flex flex-col gap-3 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-lg font-bold tracking-wider">Nº {postulacion.numero}</span>
                  <InsigniaDePostulacion estado={postulacion.estado} />
                </div>
                {documentos.length > 0 ? (
                  <div className="flex min-w-52 items-center gap-3">
                    <div
                      role="img"
                      aria-label={`${aprobados} de ${documentos.length} documentos aprobados`}
                      className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
                    >
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${porcentaje(aprobados, documentos.length)}%` }}
                      />
                    </div>
                    <span className="text-xs whitespace-nowrap text-muted-foreground">
                      {aprobados} de {documentos.length} aprobados
                    </span>
                  </div>
                ) : null}
              </div>

              {documentos.length === 0 ? (
                <p className="px-6 py-5 text-sm text-muted-foreground">Todavía no subió documentos.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {documentos.map((documento) => {
                    const { etiqueta, icono: Icono, caja } = PRESENTACION_DE_DOCUMENTO[documento.estado]

                    return (
                      <li key={documento.id} className="space-y-3 px-6 py-4">
                        <div className="flex flex-wrap items-center gap-3.5">
                          <span
                            aria-hidden="true"
                            className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', caja)}
                          >
                            <Icono className="size-5" />
                          </span>
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <span className="block text-sm font-semibold">{documento.tipo}</span>
                            <span className="block text-xs text-muted-foreground">
                              <a
                                href={`/personal/documentacion/${documento.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary underline"
                              >
                                Ver {documento.nombreArchivo}
                              </a>{' '}
                              · subido el {formatearFecha(documento.creadoEl)}
                            </span>
                          </div>
                          <span
                            className={cn(
                              'rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                              ESTILO_DE_DOCUMENTO[documento.estado],
                            )}
                          >
                            {etiqueta}
                          </span>
                        </div>

                        {documento.observaciones ? (
                          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive sm:ml-13.5">
                            <strong>Observación:</strong> {documento.observaciones}
                          </p>
                        ) : null}

                        {postulacion.estado !== 'DOCUMENTACION_VALIDADA' ? (
                          <div className="flex flex-wrap items-end gap-4 sm:ml-13.5">
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
                    )
                  })}
                </ul>
              )}
            </section>
          )
        })}
      </main>
    </div>
  )
}
