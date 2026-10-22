// src/apps/web/app/page.tsx
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

// Página provisoria: la landing real es H10 (#29).
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8 text-foreground">
      <h1 className="text-3xl font-semibold">Gestión de ingresantes</h1>
      <Link href="/aspirante/inscripcion" className={buttonVariants()}>
        Iniciar Inscripción
      </Link>
    </main>
  )
}