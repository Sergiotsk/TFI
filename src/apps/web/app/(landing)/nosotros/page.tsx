import type { Metadata } from 'next'
import Link from 'next/link'
import { DOCENTE, EQUIPO } from '@/lib/landing/datos'
import { AvatarPersona } from '@/components/landing/avatar-persona'
import { EquipoApilado } from '@/components/landing/equipo-apilado'
import { Revelado } from '@/components/landing/revelado'

export const metadata: Metadata = {
  title: 'Sobre nosotros',
}

export default function Nosotros() {
  return (
    <>
      <Revelado />
      <section
        className='banda-azul hero hero--nosotros'
        aria-labelledby='nosotros-titulo'
        data-parallax='0.08'
      >
        <div className='container hero__grid hero__grid--nosotros'>
          <div className='hero__texto'>
            <p className='pill pill--oscura pill--pulso'>
              <span className='pill__punto' aria-hidden='true' />
              Equipo 5
            </p>
            <h1 id='nosotros-titulo' tabIndex={-1}>
              Sobre nosotros
            </h1>
            <p className='hero__bajada'>
              Somos cuatro estudiantes de la Tecnicatura Universitaria en
              Programación que diseñamos y construimos este sistema, con dos
              personas en el frontend y dos en el backend.
            </p>
          </div>
          <div className='hero__marca' aria-hidden='true'>
            <img
              src='/landing/img/grupo_avatars_sin_fondo.webp'
              alt=''
              className='hero__marca-imagen'
            />
          </div>
        </div>
      </section>

      <section
        className='section equipo-section-full'
        aria-labelledby='integrantes-titulo'
      >
        <div className='equipo-wrapper'>
          <div className='equipo-section__cabecera equipo-section__cabecera--full reveal'>
            <h2 id='integrantes-titulo'>Quiénes somos</h2>
            <p className='section__bajada'>
              Conocé al equipo que diseñó y construyó el Sistema de Ingreso TUP.
            </p>
          </div>
          <EquipoApilado>
            {EQUIPO.map((persona, i) => (
              <li
                className={`persona persona--full ${i % 2 === 1 ? 'persona--invertida' : ''}`}
                key={persona.nombre}
              >
                <AvatarPersona nombre={persona.nombre} foto={persona.foto} />
                <div className='persona__cuerpo'>
                  <div className='persona__cabecera'>
                    <h3>{persona.nombre}</h3>
                    <p className='pill'>{persona.rol}</p>
                  </div>
                  {persona.resumen !== '' ? (
                    <p className='persona__resumen persona__resumen--amplio'>
                      {persona.resumen}
                    </p>
                  ) : null}
                  <p className='persona__detalle'>
                    Integrante del Equipo 5 del Trabajo Final Integrador de la
                    Práctica Profesional Supervisada 2026, UTN Facultad Regional
                    Haedo. Participa en el diseño, arquitectura y desarrollo del
                    Sistema de Ingreso TUP, con foco en la calidad, las reglas
                    de negocio y la experiencia de uso.
                  </p>
                  {persona.tecnologias.length > 0 ? (
                    <ul className='chips' aria-label='Tecnologías'>
                      {persona.tecnologias.map((tecnologia) => (
                        <li key={tecnologia}>{tecnologia}</li>
                      ))}
                    </ul>
                  ) : null}
                  {persona.github !== '' || persona.linkedin !== '' ? (
                    <p className='persona__links'>
                      {persona.github !== '' ? (
                        <a
                          className='enlace'
                          href={persona.github}
                          target='_blank'
                          rel='noopener'
                        >
                          GitHub
                        </a>
                      ) : null}
                      {persona.linkedin !== '' ? (
                        <a
                          className='enlace'
                          href={persona.linkedin}
                          target='_blank'
                          rel='noopener'
                        >
                          LinkedIn
                        </a>
                      ) : null}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </EquipoApilado>
        </div>
      </section>

      <section
        className='section section--tinte'
        aria-labelledby='contexto-titulo'
      >
        <div className='container split'>
          <div className='split__intro reveal reveal--izq'>
            <h2 id='contexto-titulo'>Un proyecto real</h2>
            <p>
              Este es el Trabajo Final Integrador de la Práctica Profesional
              Supervisada 2026 de la UTN Facultad Regional Haedo. Docente:{' '}
              {DOCENTE}.
            </p>
          </div>
          <div className='texto-largo reveal'>
            <p>
              Partimos de entrevistas con quienes gestionan el ingreso,
              definimos las reglas del negocio y las pantallas, y las llevamos a
              un sistema pensado para que la Facultad lo use.
            </p>
            <p>
              <Link className='enlace' href='/contacto'>
                Escribirle al equipo
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
