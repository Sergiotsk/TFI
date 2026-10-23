import Link from 'next/link'
import { AccionPendiente } from '@/components/maqueta/accion-pendiente'
import { EncabezadoDePanel } from '@/components/panel/encabezado-de-panel'
import { InsigniaDePago, motivosDeNoImputado } from '@/components/panel/insignia-de-estado'
import { cn } from '@/lib/utils'
import {
  cargasDeInforme,
  formatearFecha,
  formatearMonto,
  pagosEnBandeja,
  type PagoEnBandeja,
} from '@/maquetas/datos'

// Maqueta de T073 con datos de ejemplo. Sin guarda de sesión: la protege el proxy del plan de login.
// Se conecta a GET /api/pagos?estado= y POST /api/pagos/acreditaciones (contracts/api-http.md).
const pestanas: { estado: PagoEnBandeja['estado']; etiqueta: string }[] = [
  { estado: 'NO_IMPUTADO', etiqueta: 'No imputados' },
  { estado: 'DEVUELTO', etiqueta: 'Devueltos' },
]

export default async function BandejaDePagosPage({
  searchParams,
}: {
  searchParams: Promise<{ [clave: string]: string | string[] | undefined }>
}) {
  const { estado } = await searchParams
  const activa = pestanas.find((p) => p.estado === estado)?.estado ?? 'NO_IMPUTADO'
  const pagos = pagosEnBandeja.filter((p) => p.estado === activa)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <EncabezadoDePanel
        area="Tesorería y Secretaría TUP"
        titulo="Bandeja de pagos"
        descripcion="Pagos del informe diario que no se pudieron imputar a una postulación, y pagos devueltos."
        acciones={<AccionPendiente>Importar informe</AccionPendiente>}
      />

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="space-y-4">
          <nav aria-label="Estado del pago" className="flex gap-2">
            {pestanas.map((pestana) => (
              <Link
                key={pestana.estado}
                href={`?estado=${pestana.estado}`}
                aria-current={pestana.estado === activa ? 'page' : undefined}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-sm font-medium',
                  pestana.estado === activa
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground',
                )}
              >
                {pestana.etiqueta}
              </Link>
            ))}
          </nav>

          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Referencia</th>
                  <th className="px-4 py-3 font-medium">DNI informado</th>
                  <th className="px-4 py-3 font-medium">Monto</th>
                  <th className="px-4 py-3 font-medium">Pagó el</th>
                  <th className="px-4 py-3 font-medium">{activa === 'NO_IMPUTADO' ? 'Motivo' : 'Aspirante'}</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago) => (
                  <tr key={pago.pagoId} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{pago.referencia}</td>
                    <td className="px-4 py-3">{pago.dniInformado}</td>
                    <td className="px-4 py-3">{formatearMonto(pago.montoCentavos)}</td>
                    <td className="px-4 py-3">{formatearFecha(pago.pagadoEl)}</td>
                    <td className="px-4 py-3">
                      {pago.motivo ? motivosDeNoImputado[pago.motivo] : (pago.aspirante ?? '—')}
                    </td>
                    <td className="px-4 py-3">
                      <InsigniaDePago estado={pago.estado} />
                    </td>
                  </tr>
                ))}
                {pagos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                      No hay pagos en este estado.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Cargas de informe</h2>
          <ul className="space-y-3">
            {cargasDeInforme.map((carga) => (
              <li key={carga.id} className="rounded-2xl border border-border bg-card p-4 shadow-xs">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-mono text-xs break-all">{carga.nombreArchivo}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatearFecha(carga.cargadaEl)} · {carga.cargadaPor}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  <div>
                    <dt className="text-muted-foreground">Acreditados</dt>
                    <dd className="font-semibold">{carga.acreditados}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">A decidir</dt>
                    <dd className="font-semibold">{carga.aDecidir}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">No imputados</dt>
                    <dd className="font-semibold">{carga.noImputados}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Duplicados</dt>
                    <dd className="font-semibold">{carga.duplicados}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}
