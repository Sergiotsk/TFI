import type { Metadata } from 'next'
import { PanelDePruebas } from '@/components/pruebas/panel-de-pruebas'

export const metadata: Metadata = {
  title: 'Laboratorio de endpoints',
  description: 'Página para probar la API de Postulaciones con distintas cuentas.',
}

export default function PaginaDePruebas() {
  return <PanelDePruebas />
}
