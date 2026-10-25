import Link from 'next/link'
import { EncabezadoDePanel } from '@/components/panel/encabezado-de-panel'
import { formatearFecha, formatearMontoEnCentavos } from '@/components/panel/formato'
import { FormularioDeDecision } from '@/components/panel/formulario-de-decision'
import { InsigniaDePago, motivosDeRevision } from '@/components/panel/insignia-de-estado'
import { conActorDePanel } from '../../../sesion-de-panel'
import { decidirCasoAccion } from './actions'
import { avisoDeDecision } from './esquemas'
import type { CasoADecidir } from '@tfi/application'

// Casos de Dirección (US5): pagos que no se pudieron confirmar solos, por fuera de plazo o sin cupo
// (ListarCasosADecidir). Aceptar confirma la vacante aunque se pase el cupo; rechazar deja el pago para devolver.
export default async function CasosDeDireccionPage({
  searchParams,
}: {
  searchParams: Promise<{ [clave: string]: string | string[] | undefined }>
}) {
  const aviso = avisoDeDecision(await searchParams)
  const casos = await conActorDePanel(async ({ listarCasosADecidir }, actor) =>
    actor.rol === 'DIRECCION' ? listarCasosADecidir.ejecutar(actor) : null,
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <EncabezadoDePanel
        area="Director de la TUP"
        titulo="Pagos a decidir"
        descripcion="Pagos acreditados que no se pudieron confirmar solos. Aceptar confirma la vacante aunque se pase el cupo."
      />

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
        {aviso ? (
          <div
            role="status"
            className="flex items-start justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm"
          >
            <p className="font-medium text-primary">{aviso}</p>
            <Link href="/direccion/casos" className="text-xs text-muted-foreground underline">
              Cerrar
            </Link>
          </div>
        ) : null}

        {casos === null ? (
          <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Los casos a decidir son de Dirección.
          </p>
        ) : casos.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            No hay casos pendientes.
          </p>
        ) : null}

        {casos?.map(({ pago, postulacion, aspirante, periodo }: CasoADecidir) => (
          <article key={pago.id} className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-xs">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-base font-semibold">
                  {aspirante ? `${aspirante.nombre} ${aspirante.apellido}` : 'Aspirante sin perfil visible'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {aspirante ? `DNI ${aspirante.dni} · ` : null}
                  <span className="font-mono">Nº {postulacion.numero}</span> · {periodo.nombre}
                </p>
              </div>
              <InsigniaDePago estado="A_DECIDIR" />
            </div>

            {pago.motivoRevision ? (
              <p className="text-sm font-medium">
                {motivosDeRevision[pago.motivoRevision as keyof typeof motivosDeRevision]}
              </p>
            ) : null}

            <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <div>
                <dt className="text-muted-foreground">Monto</dt>
                <dd className="font-semibold">{formatearMontoEnCentavos(pago.monto.centavos)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Pagó el</dt>
                <dd className="font-semibold">{formatearFecha(pago.pagadoEl)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Vencía el</dt>
                <dd className="font-semibold">
                  {postulacion.venceEl ? formatearFecha(postulacion.venceEl) : 'Sin plazo'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Ocupación del período</dt>
                <dd className="font-semibold">
                  {periodo.ocupados} / {periodo.totalCupos}
                </dd>
              </div>
            </dl>

            <FormularioDeDecision accion={decidirCasoAccion} pagoId={pago.id} numero={postulacion.numero} />
          </article>
        ))}
      </main>
    </div>
  )
}
