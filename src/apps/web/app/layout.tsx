import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Gestión de ingresantes',
  description: 'Preinscripción, pago y confirmación de vacantes de la TUP',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-AR" className={cn('font-sans', geist.variable)}>
      <body>{children}</body>
    </html>
  )
}
