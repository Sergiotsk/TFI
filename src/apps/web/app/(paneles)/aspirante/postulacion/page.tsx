import { AccionPendiente } from '@/components/maqueta/accion-pendiente'
import { EncabezadoDePanel } from '@/components/panel/encabezado-de-panel'
import { InsigniaDePostulacion } from '@/components/panel/insignia-de-estado'
import { formatearFecha, formatearNumero, postulacionDelAspirante } from '@/maquetas/datos'

// Maqueta de T082 con datos de ejemplo. Sin guarda de sesión: la protege el proxy del plan de login.
// Se conecta a GET /api/postulaciones/mias e iniciar-pago (contracts/api-http.md).
export default function PostulacionDelAspirantePage() {
  const postulacion = postulacionDelAspirante

  return (
    <div className="min-h-screen bg-background text-foreground">
      <EncabezadoDePanel area="Aspirante" titulo="Mi postulación" descripcion={postulacion.periodo} />

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="block text-xs font-medium text-muted-foreground">Número de postulación</span>
              <span className="font-mono text-xl font-bold tracking-wider">
                {formatearNumero(postulacion.numero)}
              </span>
            </div>
            <InsigniaDePostulacion estado={postulacion.estado} />
          </div>

          {postulacion.venceEl ? (
            <div>
              <span className="block text-xs font-medium text-muted-foreground">Fecha límite para pagar</span>
              <span className="text-base font-semibold">{formatearFecha(postulacion.venceEl)}</span>
            </div>
          ) : null}

          {postulacion.estado === 'PAGO_PENDIENTE' ? (
            <p className="rounded-lg border border-secondary/30 bg-accent p-4 text-sm text-accent-foreground">
              Tu lugar <strong>no está reservado</strong> hasta que se acredite el pago.
            </p>
          ) : null}
          {postulacion.estado === 'PAGO_EN_REVISION' ? (
            <p className="rounded-lg border border-secondary/30 bg-accent p-4 text-sm text-accent-foreground">
              Tu pago está en revisión. Te avisamos cuando Dirección lo resuelva.
            </p>
          ) : null}

          {postulacion.estado === 'PREINSCRIPTO' || postulacion.estado === 'VENCIDO' ? (
            <AccionPendiente size="lg">Iniciar pago</AccionPendiente>
          ) : null}
          {postulacion.estado === 'PAGO_PENDIENTE' ? (
            <AccionPendiente size="lg">Ir a pagar</AccionPendiente>
          ) : null}
        </section>
      </main>
    </div>
  )
}
