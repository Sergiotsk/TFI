import type { Metadata } from 'next'
import Link from 'next/link'
import { DOCENTE, EQUIPO } from '@/lib/landing/datos'
import { AvatarPersona } from '@/components/landing/avatar-persona'
import { Revelado } from '@/components/landing/revelado'

export const metadata: Metadata = {
  title: 'Sobre nosotros',
}

export default function Nosotros() {
  return (
    <>
      <Revelado />
      <div className="banda-azul cabecera-vista">
        <div className="container">
          <h1 id="nosotros-titulo" tabIndex={-1}>
            Sobre nosotros
          </h1>
          <p className="cabecera-vista__bajada">
            Somos el Equipo 5: cuatro estudiantes de la Tecnicatura Universitaria en Programación
            que diseñamos y construimos este sistema, con dos personas en el frontend y dos en el
            backend.
          </p>
        </div>
      </div>

      <section className="section" aria-labelledby="integrantes-titulo">
        <div className="container">
          <h2 id="integrantes-titulo" className="reveal">
            Quiénes somos
          </h2>
          <ul className="equipo">
            {EQUIPO.map((persona) => (
              <li className="persona reveal" key={persona.nombre}>
                <AvatarPersona nombre={persona.nombre} foto={persona.foto} />
                <div className="persona__cuerpo">
                  <h3>{persona.nombre}</h3>
                  <p className="pill">{persona.rol}</p>
                  {persona.resumen !== '' ? (
                    <p className="persona__resumen">{persona.resumen}</p>
                  ) : null}
                  {persona.tecnologias.length > 0 ? (
                    <ul className="chips" aria-label="Tecnologías">
                      {persona.tecnologias.map((tecnologia) => (
                        <li key={tecnologia}>{tecnologia}</li>
                      ))}
                    </ul>
                  ) : null}
                  {persona.github !== '' || persona.linkedin !== '' ? (
                    <p className="persona__links">
                      {persona.github !== '' ? (
                        <a className="enlace" href={persona.github} target="_blank" rel="noopener">
                          GitHub
                        </a>
                      ) : null}
                      {persona.linkedin !== '' ? (
                        <a
                          className="enlace"
                          href={persona.linkedin}
                          target="_blank"
                          rel="noopener"
                        >
                          LinkedIn
                        </a>
                      ) : null}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--tinte" aria-labelledby="contexto-titulo">
        <div className="container split">
          <div className="split__intro reveal">
            <h2 id="contexto-titulo">Un proyecto real</h2>
            <p>
              Este es el Trabajo Final Integrador de la Práctica Profesional Supervisada 2026 de la
              UTN Facultad Regional Haedo. Docente: {DOCENTE}.
            </p>
          </div>
          <div className="texto-largo reveal">
            <p>
              Partimos de entrevistas con quienes gestionan el ingreso, definimos las reglas del
              negocio y las pantallas, y las llevamos a un sistema pensado para que la Facultad lo
              use.
            </p>
            <p>
              <Link className="enlace" href="/contacto">
                Escribirle al equipo
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
