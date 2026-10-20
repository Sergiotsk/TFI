import type { Metadata } from 'next'
import { PROYECTO_NOMBRE, SISTEMA_URL } from '@/lib/landing/datos'
import { FlechaDerecha } from '@/components/landing/flecha'
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
      <section className="banda-azul hero" aria-labelledby="hero-titulo">
        <div className="container hero__grid">
          <div className="hero__texto">
            <p className="pill pill--oscura">Tecnicatura Universitaria en Programación</p>
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
          <div className="split__intro reveal">
            <h2 id="problema-titulo">Hoy, el ingreso depende de herramientas que no se hablan</h2>
            <p>
              Formularios, carpetas compartidas, planillas y correos sostienen el proceso.
              Secretaría revisa la documentación de cada aspirante antes de saber si va a pagar, y
              nadie tiene una vista única de cuántas personas están realmente confirmadas.
            </p>
          </div>
          <dl className="hallazgos reveal">
            <div className="hallazgos__item">
              <dt>Sin una vista única</dt>
              <dd>
                El estado de cada aspirante está repartido entre formularios, carpetas, planillas y
                mails.
              </dd>
            </div>
            <div className="hallazgos__item">
              <dt>Revisión antes de saber si paga</dt>
              <dd>
                Se controla documentación a mano y recién después se pide el pago, así que parte de
                ese trabajo es para personas que nunca terminan pagando.
              </dd>
            </div>
            <div className="hallazgos__item">
              <dt>Pagos controlados a mano</dt>
              <dd>
                Comprobantes y transferencias se cruzan manualmente, y la cantidad real de
                ingresantes se conoce tarde.
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
              En vez de revisar papeles primero y cobrar después, el pago pasa a ser el hito que
              confirma la vacante.
            </p>
          </div>

          <div className="flujos reveal">
            <div className="flujo flujo--actual">
              <h3 className="flujo__titulo">Flujo actual</h3>
              <ol className="flujo__pasos">
                <li>Se inscribe</li>
                <li>Sube documentos</li>
                <li>Secretaría revisa a mano</li>
                <li>Se le pide el pago</li>
              </ol>
            </div>
            <div className="flujo flujo--nuevo">
              <h3 className="flujo__titulo">Flujo propuesto</h3>
              <ol className="flujo__pasos">
                <li>Preinscripción ligera</li>
                <li>Paga la matrícula</li>
                <li className="flujo__hito">Vacante confirmada</li>
                <li>Carga la documentación</li>
              </ol>
            </div>
          </div>

          <p className="regla reveal">
            <strong>Pago acreditado = vacante confirmada.</strong> Es la regla central que definió la
            Dirección de la carrera. La documentación se revisa después, y el sistema no deja que
            una Postulación salte pasos.
          </p>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="section" id="como-funciona" aria-labelledby="como-titulo">
        <div className="container split split--ancho">
          <div className="split__intro reveal">
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
          <ol className="pasos reveal">
            <li className="pasos__item">
              <h3>Preinscripción</h3>
              <p>
                La persona carga sus datos mínimos, conoce los requisitos y acepta las condiciones
                antes de pagar.
              </p>
            </li>
            <li className="pasos__item">
              <h3>Pago</h3>
              <p>
                Puede pagar online o en la ventanilla de Tesorería. El sistema le muestra su ID de
                Postulación.
              </p>
            </li>
            <li className="pasos__item pasos__item--hito">
              <h3>Acreditación</h3>
              <p>
                Cuando el pago se acredita, ya sea por la pasarela de pago o por el listado que
                Tesorería sube una vez por día, la vacante queda confirmada.
              </p>
            </li>
            <li className="pasos__item">
              <h3>Documentación</h3>
              <p>
                Con la vacante asegurada, la persona sube los documentos requeridos. Secretaría los
                revisa y puede pedir correcciones.
              </p>
            </li>
            <li className="pasos__item">
              <h3>Seguimiento</h3>
              <p>
                En todo momento puede ver en qué estado está su trámite y qué le falta.
              </p>
            </li>
          </ol>
        </div>
      </section>

      {/* Qué cambia para cada rol */}
      <section className="section section--blanca" aria-labelledby="roles-titulo">
        <div className="container">
          <h2 id="roles-titulo" className="reveal">
            Qué cambia para cada rol
          </h2>
          <dl className="roles reveal">
            <div className="roles__item">
              <dt>Postulantes</dt>
              <dd>
                Saben qué falta y en qué estado está su trámite, sin depender de mails sueltos.
              </dd>
            </div>
            <div className="roles__item">
              <dt>Secretaría TUP</dt>
              <dd>
                Revisa documentación solo de quienes ya confirmaron su vacante, y queda registrado
                quién aprobó cada documento.
              </dd>
            </div>
            <div className="roles__item">
              <dt>Tesorería</dt>
              <dd>
                Sube un listado por día y el sistema acredita los pagos, sin cruzar comprobantes a
                mano.
              </dd>
            </div>
            <div className="roles__item">
              <dt>Dirección</dt>
              <dd>
                Ve cuántas personas pagaron y cuántas vacantes están confirmadas, sin recuentos
                manuales.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Tecnología */}
      <section className="section" id="tecnologia" aria-labelledby="tecnologia-titulo">
        <div className="container split">
          <div className="split__intro reveal">
            <h2 id="tecnologia-titulo">Las reglas del negocio no dependen de la tecnología</h2>
            <p>
              El sistema usa arquitectura hexagonal: las reglas viven en el centro y todo lo de
              afuera (pantallas, base de datos, pasarela de pago) se conecta por puertos. Si una de
              esas piezas cambia, el negocio no se toca.
            </p>
            <p>
              La integración con la facultad es solo por archivo: el sistema no lee ni escribe en
              SysAdmin ni en SysAcad.
            </p>
          </div>
          <div className="reveal">
            <div
              className="capas"
              role="img"
              aria-label="Tres capas concéntricas: adaptadores por fuera, casos de uso en el medio y dominio en el centro"
            >
              <div className="capas__anillo capas__anillo--externo">
                <span className="capas__nombre">Adaptadores</span>
                <span className="capas__detalle">Pantallas, base de datos, pagos, informes</span>
                <div className="capas__anillo capas__anillo--medio">
                  <span className="capas__nombre">Casos de uso</span>
                  <div className="capas__anillo capas__anillo--centro">
                    <span className="capas__nombre">Dominio</span>
                    <span className="capas__detalle">Reglas del negocio</span>
                  </div>
                </div>
              </div>
            </div>
            <dl className="stack">
              <div className="stack__item">
                <dt>Interfaz</dt>
                <dd>Next.js, React, TypeScript, Tailwind CSS y shadcn/ui</dd>
              </div>
              <div className="stack__item">
                <dt>Datos</dt>
                <dd>Supabase (PostgreSQL, autenticación y almacenamiento)</dd>
              </div>
              <div className="stack__item">
                <dt>Calidad</dt>
                <dd>Zod para validar datos externos y Vitest para las pruebas</dd>
              </div>
              <div className="stack__item">
                <dt>Este sitio</dt>
                <dd>Next.js y React, con el mismo sistema detrás</dd>
              </div>
            </dl>
          </div>
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
