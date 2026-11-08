import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PanelDePruebas } from '@/components/pruebas/panel-de-pruebas'
import { laboratorioHabilitado } from '@/lib/laboratorio'

export const metadata: Metadata = {
  title: 'Laboratorio de endpoints',
  description: 'Página para probar la API de Postulaciones con distintas cuentas.',
}

export default function PaginaDePruebas() {
  if (!laboratorioHabilitado(process.env.VERCEL_ENV)) notFound()

  return <PanelDePruebas />
}
