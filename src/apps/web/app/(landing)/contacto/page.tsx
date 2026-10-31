import type { Metadata } from 'next'
import { SEDE_DIRECCION, SEDE_MAPA_LINK, SEDE_MAPA_URL } from '@/lib/landing/datos'
import { FormularioContacto } from '@/components/landing/formulario-contacto'
import { Revelado } from '@/components/landing/revelado'
import '../institucion-contacto.css'

const IMG_CONTACTO_FONDO = '/landing/img/foto-contacto.webp'

export const metadata: Metadata = {
  title: 'Contacto',
}

export default function Contacto() {
  return (
    <>
      <Revelado />
      <div
        className="banda-azul cabecera-vista contacto-hero"
        data-parallax="0.06"
        style={{ '--contacto-fondo': `url('${IMG_CONTACTO_FONDO}')` } as React.CSSProperties}
      >
        <div className="container">
          <h1 id="contacto-titulo" tabIndex={-1}>
            Contacto
          </h1>
          <p className="cabecera-vista__bajada">
            ¿Tenés una duda sobre el proceso de inscripción o sobre el proyecto? Escribinos y lo
            vemos.
          </p>
        </div>
      </div>

      <section className="section" aria-label="Formulario y ubicación">
        <div className="container contacto__grid">
          <FormularioContacto />

          <div className="ubicacion reveal">
            <div className="mapa">
              <iframe
                title="Mapa con la ubicación de la UTN Facultad Regional Haedo"
                src={SEDE_MAPA_URL}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <dl className="datos datos--vertical">
              <div className="datos__item">
                <dt>UTN Facultad Regional Haedo</dt>
                <dd>{SEDE_DIRECCION}</dd>
              </div>
              <div className="datos__item">
                <dt>Cómo llegar</dt>
                <dd>
                  <a className="enlace" href={SEDE_MAPA_LINK} target="_blank" rel="noopener">
                    Abrir en Google Maps
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </>
  )
}
