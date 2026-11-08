import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { SISTEMA_URL } from '@/lib/landing/datos'
import { Pie } from '@/components/landing/pie'
import './(landing)/landing.css'

export const metadata: Metadata = {
  title: 'Página no encontrada',
  description: 'La página que buscás no existe o cambió de lugar.',
}

export default function PaginaNoEncontrada() {
  return (
    <main className='relative isolate flex min-h-screen flex-col overflow-hidden bg-[#001e3c] text-white'>
      {/* Foto: vertical en mobile/tablet, horizontal desde 960 px (igual que el hero de la landing) */}
      <div
        aria-hidden='true'
        className="absolute inset-0 -z-20 bg-[url('/landing/img/fondo-hero-utn-mobbile.webp')] bg-cover bg-[position:center_top] bg-no-repeat min-[960px]:bg-[url('/landing/img/fondo-hero-utn.webp')]"
      />
      {/* Velo: vertical en mobile, concentrado a la izquierda en desktop */}
      <div
        aria-hidden='true'
        className='absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,30,60,0.92)_0%,rgba(0,42,78,0.82)_40%,rgba(0,64,110,0.7)_70%,rgba(0,72,125,0.65)_100%)] min-[960px]:bg-[linear-gradient(100deg,rgba(0,30,60,0.94)_0%,rgba(0,42,78,0.82)_48%,rgba(0,64,110,0.45)_80%,rgba(0,72,125,0.4)_100%)]'
      />

      <section className='mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-16 sm:py-20'>
        <div className='grid w-full items-center gap-12 min-[960px]:grid-cols-[1.15fr_0.85fr] min-[960px]:gap-[4.5rem]'>
          {/* Texto */}
          <div>
            <span className='nf-entrada inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur'>
              <span className='h-2.5 w-2.5 rounded-full bg-sky-300' />
              Error 404
            </span>

            <h1 className='nf-entrada nf-d1 mt-5 max-w-[12ch] text-[clamp(2.9rem,7.4vw,5.4rem)] font-extrabold leading-none tracking-[-0.04em]'>
              Te saliste del mapa.
            </h1>

            <p className='nf-entrada nf-d2 mt-6 max-w-[44ch] text-lg text-sky-50 [text-shadow:0_1px_2px_rgba(0,20,40,0.45)] sm:text-xl'>
              No encontramos esta página. Puede que el link esté mal escrito o
              que haya cambiado de lugar. Volvé al inicio o entrá al sistema
              para seguir con tu inscripción.
            </p>

            <div className='mt-9 flex flex-wrap gap-3.5'>
              <Link
                href={SISTEMA_URL}
                className='nf-entrada nf-d3 inline-flex h-14 items-center justify-center rounded-xl bg-white px-7 text-base font-semibold text-primary shadow-lg shadow-black/20 transition hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#001e3c]'
              >
                Ir al sistema de inscripción
              </Link>
              <Link
                href='/'
                className='nf-entrada nf-d4 inline-flex h-14 items-center justify-center rounded-xl border-2 border-white/40 px-7 text-base font-semibold text-white transition hover:border-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#001e3c]'
              >
                Volver al inicio
              </Link>
            </div>
          </div>

          {/* Tarjeta blanca (mismo lenguaje que "Recorrido de una postulación") */}
          <div className='nf-entrada nf-d3 mx-auto w-full max-w-md rounded-3xl bg-white p-6 text-slate-900 shadow-2xl shadow-black/30 sm:p-8'>
            <div className='flex items-center justify-between gap-4 border-b border-dashed border-slate-300 pb-5'>
              <p className='text-lg font-bold'>Página no encontrada</p>
              <span className='rounded-full border border-primary/25 bg-sky-50 px-3 py-1 text-sm font-medium text-primary'>
                404
              </span>
            </div>

            <div className='relative flex aspect-[4/3] items-center justify-center overflow-hidden'>
              <span
                aria-hidden='true'
                className='pointer-events-none absolute select-none text-[9rem] font-black leading-none tracking-tighter text-transparent sm:text-[11rem]'
                style={{
                  WebkitTextStroke:
                    '2px color-mix(in srgb, var(--primary) 25%, transparent)',
                }}
              >
                404
              </span>
              <Image
                src='/brand/logo-con-nombre-abajo-sin-fondo.webp'
                alt='GIU — Gestión de Ingresantes Universitarios'
                width={800}
                height={447}
                priority
                className='relative z-10 w-[78%] object-contain opacity-25'
              />
            </div>

            <p className='border-t border-dashed border-slate-300 pt-5 text-sm text-slate-600'>
              UTN Facultad Regional Haedo · Tecnicatura Universitaria en
              Programación
            </p>
          </div>
        </div>
      </section>

      <div className='landing'>
        <Pie />
        {/* Botón fijo para celulares: el acceso al sistema siempre está a mano */}
        <a className='cta-movil' href={SISTEMA_URL}>
          Ir al sistema de inscripción
        </a>
      </div>

      {/* Entrada al cargar, igual que el hero de la landing */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .nf-entrada { animation: nf-entrada-suave 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) backwards; }
          .nf-d1 { animation-delay: 0.08s; }
          .nf-d2 { animation-delay: 0.17s; }
          .nf-d3 { animation-delay: 0.27s; }
          .nf-d4 { animation-delay: 0.35s; }
        }
        @keyframes nf-entrada-suave {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </main>
  )
}
