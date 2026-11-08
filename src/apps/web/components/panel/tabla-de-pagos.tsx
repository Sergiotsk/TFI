import type { Pago } from '@tfi/domain'
import { formatearFecha, formatearMontoEnCentavos } from '@/components/panel/formato'
import { InsigniaDePago, motivosDeNoImputado, motivosDeRevision } from '@/components/panel/insignia-de-estado'

interface TablaDePagosProps {
  pagos: readonly Pago[]
  vacio: string
}

// Los pagos de una bandeja (no imputados o devoluciones), con lo que informó el banco y el motivo.
export function TablaDePagos({ pagos, vacio }: TablaDePagosProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-border bg-muted text-xs tracking-wide text-primary uppercase">
          <tr>
            <th className="px-4 py-3 font-bold">Referencia</th>
            <th className="px-4 py-3 font-bold">DNI informado</th>
            <th className="px-4 py-3 font-bold">Nº informado</th>
            <th className="px-4 py-3 font-bold">Monto</th>
            <th className="px-4 py-3 font-bold">Pagó el</th>
            <th className="px-4 py-3 font-bold">Motivo</th>
            <th className="px-4 py-3 font-bold">Estado</th>
          </tr>
        </thead>
        <tbody>
          {pagos.map((pago) => (
            <tr key={pago.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-mono text-xs">{pago.referencia.referenciaExterna}</td>
              <td className="px-4 py-3">{pago.dniInformado?.valor ?? '—'}</td>
              <td className="px-4 py-3">
                {pago.numeroInformado ? String(pago.numeroInformado.valor).padStart(6, '0') : '—'}
              </td>
              <td className="px-4 py-3">{formatearMontoEnCentavos(pago.monto.centavos)}</td>
              <td className="px-4 py-3">{formatearFecha(pago.pagadoEl)}</td>
              <td className="px-4 py-3">
                {pago.motivoNoImputado
                  ? motivosDeNoImputado[pago.motivoNoImputado]
                  : pago.motivoRevision
                    ? motivosDeRevision[pago.motivoRevision]
                    : '—'}
              </td>
              <td className="px-4 py-3">
                <InsigniaDePago estado={pago.estado} />
              </td>
            </tr>
          ))}
          {pagos.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                {vacio}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}
