import type { Metadata } from 'next'
import Link from 'next/link'
import { FOTOS_SEDE, FRH_SITIO, SEDE_DIRECCION, UTN_SITIO } from '@/lib/landing/datos'
import { CarruselSede } from '@/components/landing/carrusel-sede'
import { PortadaSede } from '@/components/landing/portada-sede'
import { Revelado } from '@/components/landing/revelado'

export const metadata: Metadata = {
  title: 'Institución',
}

export default function Institucion() {
  return (
    <>
      <Revelado />
      <PortadaSede>
        <h1 id="institucion-titulo" tabIndex={-1}>
          La institución
        </h1>
        <p className="cabecera-vista__bajada">
          Este sistema nace dentro de la UTN Facultad Regional Haedo y está pensado para que lo
          use <strong>la propia Facultad</strong>.
        </p>
      </PortadaSede>

      <section className="section" aria-labelledby="utn-titulo">
        <div className="container split">
          <div className="split__intro reveal reveal--izq">
            <h2 id="utn-titulo">Una universidad nacional dedicada a la tecnología</h2>
            <p>
              La Universidad Tecnológica Nacional (UTN) se creó el{' '}
              <strong>14 de octubre de 1959</strong> por la ley 14.855. Su antecedente es la
              Universidad Obrera, que ya funcionaba con estructura universitaria desde 1953.
            </p>
          </div>
          <div className="texto-largo reveal">
            <p>
              Es <strong>la única universidad nacional del país</strong> cuya estructura académica
              tiene a las ingenierías como eje central, y tiene <strong>carácter federal</strong>:
              sus facultades regionales están repartidas en distintas ciudades de la Argentina, y
              cada una responde a las necesidades productivas de su zona.
            </p>
            <p>
              <a className="enlace" href={UTN_SITIO} target="_blank" rel="noopener">
                Sitio de la UTN
              </a>
            </p>
          </div>
        </div>
      </section>

      <section className="section section--tinte" aria-labelledby="frh-titulo">
        <div className="container split">
          <div className="split__intro reveal reveal--izq">
            <h2 id="frh-titulo">Facultad Regional Haedo</h2>
            <p>
              Es parte de la comunidad de Haedo y fue reconocida como Facultad Regional en{' '}
              <strong>1972</strong>. En <strong>1983</strong> inauguró su sede actual en París 532.
            </p>
          </div>
          <div className="texto-largo reveal">
            <p>
              Además de formar profesionales en ingeniería, la Facultad ofrece{' '}
              <strong>carreras de grado y posgrado y cursos</strong>, y trabaja con empresas e
              instituciones de la zona: brinda consultoría y arma propuestas de capacitación a
              medida.
            </p>
            <p>La oferta completa de carreras y cursos se consulta en el sitio de la Facultad.</p>
            <p>
              <a className="enlace" href={FRH_SITIO} target="_blank" rel="noopener">
                Sitio de la Facultad Regional Haedo
              </a>
            </p>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="tup-titulo">
        <div className="container split">
          <div className="split__intro reveal reveal--izq">
            <h2 id="tup-titulo">La Tecnicatura y este proyecto</h2>
            <p>
              El ingreso a la Tecnicatura Universitaria en Programación (TUP) hoy se gestiona con{' '}
              <strong>formularios, carpetas compartidas y planillas</strong>.
            </p>
          </div>
          <div className="texto-largo reveal">
            <p>
              Para entender el problema, el Equipo 5 habló con la Dirección de la carrera, con
              Secretaría y con el área de Sistemas y Administración. De esas entrevistas salió la
              regla central del sistema: <strong>el pago acreditado confirma la vacante</strong>, y
              la documentación se revisa después.
            </p>
            <p>
              <Link className="enlace" href="/#problema">
                Ver el problema y la solución
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="section section--blanca" aria-labelledby="sede-titulo">
        <div className="container">
          <h2 id="sede-titulo" className="reveal">
            La sede
          </h2>
          <div className="reveal reveal--zoom">
            <CarruselSede fotos={FOTOS_SEDE} alt="UTN Facultad Regional Haedo" />
          </div>
          <dl className="datos reveal">
            <div className="datos__item">
              <dt>Dirección</dt>
              <dd>{SEDE_DIRECCION}</dd>
            </div>
            <div className="datos__item">
              <dt>Cómo llegar</dt>
              <dd>
                <Link className="enlace" href="/contacto">
                  Ver el mapa
                </Link>
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </>
  )
}
