import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { RedireccionAlPanel } from './redireccion-al-panel'

export const dynamic = 'force-dynamic'

export default async function PagosRetornoPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; payment_id?: string; preference_id?: string; external_reference?: string }>
}) {
  const { status } = await searchParams

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Estado de tu pago</h1>
      {status === 'success' && (
        <p>Tu pago fue recibido. Si quedó acreditado, ya se confirmó tu vacante.</p>
      )}
      {status === 'pending' && (
        <p>Tu pago está pendiente de acreditación. Te avisaremos cuando se acredite.</p>
      )}
      {status === 'failure' && (
        <p>El pago fue rechazado o cancelado. Podés intentar nuevamente.</p>
      )}
      {!status && (
        <p>Te redirigimos desde MercadoPago. El estado se actualizará en tu postulación.</p>
      )}
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
