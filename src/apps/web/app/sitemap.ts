import type { MetadataRoute } from 'next'
import { urlBaseDeLaApp } from '@/lib/url-de-app'

const PAGINAS = [
  { ruta: '/', prioridad: 1, frecuencia: 'weekly' },
  { ruta: '/institucion', prioridad: 0.8, frecuencia: 'monthly' },
  { ruta: '/nosotros', prioridad: 0.8, frecuencia: 'monthly' },
  { ruta: '/contacto', prioridad: 0.7, frecuencia: 'monthly' },
  { ruta: '/login', prioridad: 0.6, frecuencia: 'yearly' },
  { ruta: '/registro', prioridad: 0.6, frecuencia: 'yearly' },
  { ruta: '/recuperar-contrasena', prioridad: 0.3, frecuencia: 'yearly' },
] as const

export default function sitemap(): MetadataRoute.Sitemap {
  const base = urlBaseDeLaApp()
  const ultimaActualizacion = new Date()

  return PAGINAS.map(({ ruta, prioridad, frecuencia }) => ({
    url: `${base}${ruta === '/' ? '' : ruta}`,
    lastModified: ultimaActualizacion,
    changeFrequency: frecuencia,
    priority: prioridad,
  }))
}
