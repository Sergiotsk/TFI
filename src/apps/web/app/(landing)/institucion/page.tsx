import type { Metadata } from 'next'
import Link from 'next/link'
import {
  FRH_SITIO,
  SEDE_DIRECCION,
  UTN_SITIO,
} from '@/lib/landing/datos'
import { FotoOpcional } from '@/components/landing/foto-opcional'
import { Revelado } from '@/components/landing/revelado'

export const metadata: Metadata = {
  title: 'Institución',
}

const FOTOS_SEDE = [
  { archivo: '/landing/img/facultad-1.jpg', clase: 'foto--grande' },
  { archivo: '/landing/img/facultad-2.jpg', clase: '' },
  { archivo: '/landing/img/facultad-3.jpg', clase: '' },
]

export default function Institucion() {
  return (
    <>
      <Revelado />
      <div className="banda-azul cabecera-vista">
        <div className="container">
          <h1 id="institucion-titulo" tabIndex={-1}>
            La institución
          </h1>
          <p className="cabecera-vista__bajada">
            Este sistema nace dentro de la UTN Facultad Regional Haedo y está pensado para que lo
            use la propia Facultad.
          </p>
        </div>
      </div>

      <section className="section" aria-labelledby="utn-titulo">
        <div className="container split">
          <div className="split__intro reveal">
            <h2 id="utn-titulo">Una universidad nacional dedicada a la tecnología</h2>
            <p>
              La Universidad Tecnológica Nacional (UTN) se creó el 14 de octubre de 1959 por la ley
              14.855. Su antecedente es la Universidad Obrera, que ya funcionaba con estructura
              universitaria desde 1953.
            </p>
          </div>
          <div className="texto-largo reveal">
            <p>
              Es la única universidad nacional del país cuya estructura académica tiene a las
              ingenierías como eje central, y tiene carácter federal: sus facultades regionales
              están repartidas en distintas ciudades de la Argentina, y cada una responde a las
              necesidades productivas de su zona.
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
          <div className="split__intro reveal">
            <h2 id="frh-titulo">Facultad Regional Haedo</h2>
            <p>
              Es parte de la comunidad de Haedo y fue reconocida como Facultad Regional en 1972. En
              1983 inauguró su sede actual en París 532.
            </p>
          </div>
          <div className="texto-largo reveal">
            <p>
              Además de formar profesionales en ingeniería, la Facultad ofrece carreras de grado y
              posgrado y cursos, y trabaja con empresas e instituciones de la zona: brinda
              consultoría y arma propuestas de capacitación a medida.
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
          <div className="split__intro reveal">
            <h2 id="tup-titulo">La Tecnicatura y este proyecto</h2>
            <p>
              El ingreso a la Tecnicatura Universitaria en Programación (TUP) hoy se gestiona con
              formularios, carpetas compartidas y planillas.
            </p>
          </div>
          <div className="texto-largo reveal">
            <p>
              Para entender el problema, el Equipo 5 habló con la Dirección de la carrera, con
              Secretaría y con el área de Sistemas y Administración. De esas entrevistas salió la
              regla central del sistema: el pago acreditado confirma la vacante, y la documentación
              se revisa después.
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
          <div className="galeria reveal">
            {FOTOS_SEDE.map(({ archivo, clase }) => (
              <FotoOpcional
                key={archivo}
                className={clase}
                src={archivo}
                alt="UTN Facultad Regional Haedo"
                marcador="Foto de la Facultad"
              />
            ))}
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
