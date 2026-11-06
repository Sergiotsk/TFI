import type { MetadataRoute } from 'next'
import { urlBaseDeLaApp } from '@/lib/url-de-app'

// Evita que se prerenderice en el build: se genera en cada request
// (y Next lo cachea según la config de la ruta).
export const dynamic = 'force-dynamic'

const PAGINAS = [
  { ruta: '/', prioridad: 1, frecuencia: 'weekly' },
  { ruta: '/institucion', prioridad: 0.8, frecuencia: 'monthly' },
  { ruta: '/nosotros', prioridad: 0.8, frecuencia: 'monthly' },
  { ruta: '/contacto', prioridad: 0.7, frecuencia: 'monthly' },
] as const

export default function sitemap(): MetadataRoute.Sitemap {
  const base = urlBaseDeLaApp()

  return PAGINAS.map(({ ruta, prioridad, frecuencia }) => ({
    url: `${base}${ruta === '/' ? '' : ruta}`,
    changeFrequency: frecuencia,
    priority: prioridad,
  }))
}
