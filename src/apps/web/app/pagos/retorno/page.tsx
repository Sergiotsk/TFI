import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { resolverEstadoDeRetorno } from './estado'
import type { EstadoDeRetorno, ParametrosDeRetorno } from './estado'
import { RedireccionAlPanel } from './redireccion-al-panel'

export const dynamic = 'force-dynamic'

const MENSAJES: Record<EstadoDeRetorno, string> = {
  success: 'Tu pago fue recibido. Si quedó acreditado, ya se confirmó tu vacante.',
  pending: 'Tu pago está pendiente de acreditación. Te avisaremos cuando se acredite.',
  failure: 'El pago fue rechazado o cancelado. Podés intentar nuevamente.',
  desconocido: 'Te redirigimos desde MercadoPago. El estado se actualizará en tu postulación.',
}

export default async function PagosRetornoPage({
  searchParams,
}: {
  searchParams: Promise<ParametrosDeRetorno>
}) {
  const estado = resolverEstadoDeRetorno(await searchParams)

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Estado de tu pago</h1>
      <p>{MENSAJES[estado]}</p>
      <p className="text-sm text-muted-foreground">
        El sistema acredita el pago automáticamente cuando MercadoPago lo confirma.
      </p>
      <Link href="/aspirante/postulacion" className={buttonVariants()}>
        Volver a mi postulación
      </Link>
      <RedireccionAlPanel />
    </main>
  )
}
