import type { Metadata } from 'next'
import Link from 'next/link'
import { DOCENTE, EQUIPO } from '@/lib/landing/datos'
import { AvatarPersona } from '@/components/landing/avatar-persona'
import { EquipoApilado } from '@/components/landing/equipo-apilado'
import { Revelado } from '@/components/landing/revelado'
import Image from 'next/image'

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
              Equipo de desarrollo
            </p>
            <h1 id='nosotros-titulo' tabIndex={-1}>
              Sobre Nosotros
            </h1>
            <p className='hero__bajada'>
              Somos cuatro estudiantes de la Tecnicatura Universitaria en
              Programación que diseñamos y construimos el{' '}
              <b>Sistema de Ingreso TUP</b>, como parte de nuestro Trabajo Final
              Integrador de la Práctica Profesional.
            </p>
          </div>
          <div className='hero__marca' aria-hidden='true'>
            <Image
              src='/landing/img/grupo_avatars_sin_fondo.webp'
              alt=''
              className='hero__marca-imagen'
              width={300}
              height={300}
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
              Conocé al equipo que diseñó y construyó el Sistema GIU.
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
                  {persona.github !== '' ||
                  persona.linkedin !== '' ||
                  persona.portfolio !== '' ? (
                    <div className='persona__links'>
                      {persona.github !== '' ? (
                        <span className='pill'>
                          <a
                            className='enlace'
                            href={persona.github}
                            target='_blank'
                            rel='noopener'
                          >
                            <Image
                              src='/landing/img/github.svg'
                              alt=''
                              aria-hidden='true'
                              width='16'
                              height='16'
                            />
                            GitHub
                          </a>
                        </span>
                      ) : null}
                      {persona.linkedin !== '' ? (
                        <span className='pill'>
                          <a
                            className='enlace'
                            href={persona.linkedin}
                            target='_blank'
                            rel='noopener'
                          >
                            <Image
                              src='/landing/img/linkedin.svg'
                              alt=''
                              aria-hidden='true'
                              width='16'
                              height='16'
                            />
                            LinkedIn
                          </a>
                        </span>
                      ) : null}
                      {persona.portfolio !== '' ? (
                        <span className='pill'>
                          <a
                            className='enlace'
                            href={persona.portfolio}
                            target='_blank'
                            rel='noopener'
                          >
                            <Image
                              src='/landing/img/portfolio.svg'
                              alt=''
                              aria-hidden='true'
                              width='16'
                              height='16'
                            />
                            Portfolio
                          </a>
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  {persona.resumen !== '' ? (
                    <p className='persona__resumen persona__resumen--amplio'>
                      {persona.resumen}
                    </p>
                  ) : null}
                  <p className='persona__detalle'>
                    {persona.detalle
                      ? persona.detalle
                      : 'No completo su detalle.'}
                  </p>
                  {persona.tecnologias.length > 0 ? (
                    <ul className='chips' aria-label='Tecnologías'>
                      {[...new Set(persona.tecnologias)].map((tecnologia) => (
                        <li key={tecnologia}>{tecnologia}</li>
                      ))}
                    </ul>
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
              Este desarrollo corresponde al Trabajo Final Integrador de la
              Práctica Profesional Supervisada (2026) para la UTN Facultad
              Regional Haedo, bajo la supervisión de la {DOCENTE}.
            </p>
          </div>
          <div className='texto-largo reveal'>
            <p>
              A partir de entrevistas con los responsables del área de ingreso,
              relevamos las necesidades operativas, definimos las reglas de
              negocio y diseñamos una solución integral orientada a optimizar la
              gestión institucional de la Facultad.
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
