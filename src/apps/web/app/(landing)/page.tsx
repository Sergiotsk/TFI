import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import {
  CAPAS_TECNOLOGICAS,
  PASOS_PROPUESTOS,
  PROYECTO_NOMBRE,
  ROLES,
  SISTEMA_URL,
} from '@/lib/landing/datos'
import { retraso } from '@/lib/landing/retraso'
import { cn } from '@/lib/utils'
import { FlechaDerecha } from '@/components/landing/flecha'
import { IconoRol } from '@/components/landing/iconos-rol'
import { PasosConScroll } from '@/components/landing/pasos-con-scroll'
import { Revelado } from '@/components/landing/revelado'
import { TicketRecorrido } from '@/components/landing/ticket-recorrido'

// El template del layout no aplica al mismo segmento, así que el título va completo.
export const metadata: Metadata = {
  title: { absolute: `${PROYECTO_NOMBRE} | Inicio` },
}

export default function Inicio() {
  return (
    <>
      <Revelado />
      <section className="banda-azul hero" aria-labelledby="hero-titulo" data-parallax="0.12">
        <div className="container hero__grid">
          <div className="hero__texto">
            <p className="pill pill--oscura pill--pulso">
              <span className="pill__punto" aria-hidden="true" />
              Tecnicatura Universitaria en Programación
            </p>
            <h1 id="hero-titulo" tabIndex={-1}>
              El pago confirma la vacante.
            </h1>
            <p className="hero__bajada">
              Un solo sistema para inscribirse a la UTN Facultad Regional Haedo. Primero se paga,
              después se presenta la documentación.
            </p>
            <div className="hero__acciones">
              <a className="btn btn--blanco" href={SISTEMA_URL}>
                Ir al sistema de inscripción
                <FlechaDerecha />
              </a>
              <a className="btn btn--contorno" href="#problema">
                Conocer el proyecto
              </a>
            </div>
          </div>

          <TicketRecorrido />
        </div>
      </section>

      {/* El problema */}
      <section className="section" id="problema" aria-labelledby="problema-titulo">
        <div className="container split">
          <div className="split__intro reveal reveal--izq">
            <h2 id="problema-titulo">Hoy, el ingreso depende de herramientas que no se hablan</h2>
            <p>
              Formularios, carpetas compartidas, planillas y correos sostienen el proceso.
              Secretaría <strong>revisa la documentación</strong> de cada aspirante{' '}
              <strong>antes de saber si va a pagar</strong>, y nadie tiene{' '}
              <strong>una vista única</strong> de cuántas personas están realmente confirmadas.
            </p>
          </div>
          <dl className="hallazgos">
            <div className="hallazgos__item reveal" style={retraso(0)}>
              <dt>Sin una vista única</dt>
              <dd>
                El estado de cada aspirante está repartido entre{' '}
                <strong>formularios, carpetas, planillas y mails</strong>.
              </dd>
            </div>
            <div className="hallazgos__item reveal" style={retraso(1)}>
              <dt>Revisión antes de saber si paga</dt>
              <dd>
                Se controla documentación a mano y recién después se pide el pago, así que{' '}
                <strong>parte de ese trabajo es para personas que nunca terminan pagando</strong>.
              </dd>
            </div>
            <div className="hallazgos__item reveal" style={retraso(2)}>
              <dt>Pagos controlados a mano</dt>
              <dd>
                Comprobantes y transferencias <strong>se cruzan manualmente</strong>, y la cantidad
                real de ingresantes se conoce tarde.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* La solución */}
      <section className="section section--tinte" id="propuesta" aria-labelledby="propuesta-titulo">
        <div className="container">
          <div className="reveal">
            <h2 id="propuesta-titulo">La solución invierte el orden</h2>
            <p className="section__bajada">
              En vez de revisar papeles primero y cobrar después, <strong>el pago pasa a ser el
              hito que confirma la vacante</strong>.
            </p>
          </div>

          <ol className="recorrido reveal">
            {PASOS_PROPUESTOS.map((paso, i) => (
              <li
                key={paso.titulo}
                className={cn('recorrido__paso', paso.hito && 'recorrido__paso--hito')}
                style={retraso(i)}
              >
                <span className="recorrido__numero" aria-hidden="true">
                  {i + 1}
                </span>
                <h3>{paso.titulo}</h3>
                <p>{paso.detalle}</p>
                {paso.hito ? <span className="recorrido__sello">Hito</span> : null}
              </li>
            ))}
          </ol>

          <p className="regla reveal">
            <strong>Pago acreditado = vacante confirmada.</strong> Es la regla central que definió
            la Dirección de la carrera. La documentación se revisa después, y el sistema no deja
            que una Postulación salte pasos.
          </p>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="section" id="como-funciona" aria-labelledby="como-titulo">
        <div className="container split split--ancho">
          <div className="split__intro reveal reveal--izq">
            <h2 id="como-titulo">Cómo funciona</h2>
            <p>
              Cada persona sigue el mismo recorrido, y Tesorería y Secretaría trabajan sobre la
              misma información.
            </p>
            <p className="nota">
              Las pantallas del sistema son un prototipo del recorrido. Los datos que muestran son
              de ejemplo.
            </p>
            <a className="btn btn--primary" href={SISTEMA_URL}>
              Recorrer el sistema
              <FlechaDerecha />
            </a>
          </div>
          <PasosConScroll>
            <li className="pasos__item reveal" style={retraso(0)}>
              <h3>Preinscripción</h3>
              <p>
                La persona carga sus datos mínimos, conoce los requisitos y acepta las condiciones
                antes de pagar.
              </p>
            </li>
            <li className="pasos__item reveal" style={retraso(1)}>
              <h3>Pago</h3>
              <p>
                Puede pagar online o en la ventanilla de Tesorería. El sistema le muestra su ID de
                Postulación.
              </p>
            </li>
            <li className="pasos__item pasos__item--hito reveal" style={retraso(2)}>
              <h3>Acreditación</h3>
              <p>
                Cuando el pago se acredita, ya sea por la pasarela de pago o por el listado que
                Tesorería sube una vez por día, la vacante queda confirmada.
              </p>
            </li>
            <li className="pasos__item reveal" style={retraso(3)}>
              <h3>Documentación</h3>
              <p>
                Con la vacante asegurada, la persona sube los documentos requeridos. Secretaría los
                revisa y puede pedir correcciones.
              </p>
            </li>
            <li className="pasos__item reveal" style={retraso(4)}>
              <h3>Seguimiento</h3>
              <p>
                En todo momento puede ver en qué estado está su trámite y qué le falta. Al finalizar el tramite se le otorgara en esta misma plataforma el mail institucional, lejago y datos del alumno.
              </p>
            </li>
          </PasosConScroll>
        </div>
      </section>

      {/* Roles */}
      <section className="section section--blanca" aria-labelledby="roles-titulo">
        <div className="container">
          <h2 id="roles-titulo" className="reveal">
            Qué hace cada rol
          </h2>
          <ul className="roles">
            {ROLES.map((rol, i) => (
              <li className="rol reveal" key={rol.clave} style={retraso(i)}>
                <span className="rol__icono">
                  <IconoRol rol={rol.clave} />
                </span>
                <h3>{rol.nombre}</h3>
                <p>{rol.funcion}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Tecnología */}
      <section className="section" id="tecnologia" aria-labelledby="tecnologia-titulo">
        <div className="container">
          <div className="reveal">
            <h2 id="tecnologia-titulo">Las piezas detrás del sistema</h2>
            <p className="section__bajada">
              Herramientas actuales, elegidas para que el sistema sea{' '}
              <strong>fácil de mantener y de probar</strong>.
            </p>
          </div>

          <ol className="pila">
            {CAPAS_TECNOLOGICAS.map((capa, i) => (
              <li
                className="pila__capa reveal reveal--der"
                key={capa.nombre}
                style={{ ...retraso(i), '--nivel': i } as CSSProperties}
              >
                <h3 className="pila__nombre">{capa.nombre}</h3>
                <ul className="pila__piezas">
                  {capa.piezas.map((pieza) => (
                    <li key={pieza.nombre}>
                      <strong>{pieza.nombre}</strong>
                      <span>{pieza.uso}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Cierre */}
      <section className="banda-azul cierre" aria-labelledby="cierre-titulo">
        <div className="container cierre__grid">
          <h2 id="cierre-titulo">
            Recorré el proceso como lo haría una persona que se inscribe
          </h2>
          <div className="cierre__acciones">
            <a className="btn btn--blanco" href={SISTEMA_URL}>
              Ir al sistema de inscripción
              <FlechaDerecha />
            </a>
            <a className="cierre__enlace" href="/contacto">
              Escribinos tu consulta
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
