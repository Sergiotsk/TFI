<section class="vista" data-view="home" data-titulo="Inicio" aria-labelledby="hero-titulo">

    <div class="banda-azul hero">
        <div class="container hero__grid">
            <div class="hero__texto">
                <p class="pill pill--oscura">Tecnicatura Universitaria en Programación</p>
                <h1 id="hero-titulo" tabindex="-1">El pago confirma la vacante.</h1>
                <p class="hero__bajada">Un solo sistema para inscribirse a la UTN Facultad Regional Haedo. Primero se paga, después se presenta la documentación.</p>
                <div class="hero__acciones">
                    <a class="btn btn--blanco" href="<?= e(SISTEMA_URL) ?>">
                        Ir al sistema de inscripción
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                    </a>
                    <button class="btn btn--contorno" type="button" data-scroll="problema">Conocer el proyecto</button>
                </div>
            </div>

            <aside class="ticket" data-tracker aria-label="Recorrido de una Postulación">
                <div class="ticket__cabecera">
                    <p class="ticket__titulo">Recorrido de una Postulación</p>
                    <span class="pill">Ejemplo</span>
                </div>
                <ol class="ticket__lista">
                    <li class="ticket__paso" data-paso>
                        <span class="ticket__marca" aria-hidden="true"></span>
                        <div><strong>Preinscripción</strong><span>Se cargan los datos mínimos y se aceptan las condiciones.</span></div>
                    </li>
                    <li class="ticket__paso" data-paso>
                        <span class="ticket__marca" aria-hidden="true"></span>
                        <div><strong>Pago pendiente</strong><span>Se elige pagar online o en ventanilla.</span></div>
                    </li>
                    <li class="ticket__paso ticket__paso--hito" data-paso>
                        <span class="ticket__marca" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>
                        </span>
                        <div><strong>Vacante confirmada</strong><span>El pago se acredita y la vacante queda asegurada.</span></div>
                    </li>
                    <li class="ticket__paso" data-paso>
                        <span class="ticket__marca" aria-hidden="true"></span>
                        <div><strong>Documentación</strong><span>Recién ahora se suben los documentos requeridos.</span></div>
                    </li>
                </ol>
                <button type="button" class="ticket__repetir" data-repetir hidden>Ver de nuevo</button>
            </aside>
        </div>
    </div>

    <!-- El problema -->
    <section class="section" id="problema" aria-labelledby="problema-titulo">
        <div class="container split">
            <div class="split__intro reveal">
                <h2 id="problema-titulo">Hoy, el ingreso depende de herramientas que no se hablan</h2>
                <p>Formularios, carpetas compartidas, planillas y correos sostienen el proceso. Secretaría revisa la documentación de cada aspirante antes de saber si va a pagar, y nadie tiene una vista única de cuántas personas están realmente confirmadas.</p>
            </div>
            <dl class="hallazgos reveal">
                <div class="hallazgos__item">
                    <dt>Sin una vista única</dt>
                    <dd>El estado de cada aspirante está repartido entre formularios, carpetas, planillas y mails.</dd>
                </div>
                <div class="hallazgos__item">
                    <dt>Revisión antes de saber si paga</dt>
                    <dd>Se controla documentación a mano y recién después se pide el pago, así que parte de ese trabajo es para personas que nunca terminan pagando.</dd>
                </div>
                <div class="hallazgos__item">
                    <dt>Pagos controlados a mano</dt>
                    <dd>Comprobantes y transferencias se cruzan manualmente, y la cantidad real de ingresantes se conoce tarde.</dd>
                </div>
            </dl>
        </div>
    </section>

    <!-- La solución -->
    <section class="section section--tinte" id="propuesta" aria-labelledby="propuesta-titulo">
        <div class="container">
            <div class="reveal">
                <h2 id="propuesta-titulo">La solución invierte el orden</h2>
                <p class="section__bajada">En vez de revisar papeles primero y cobrar después, el pago pasa a ser el hito que confirma la vacante.</p>
            </div>

            <div class="flujos reveal">
                <div class="flujo flujo--actual">
                    <h3 class="flujo__titulo">Flujo actual</h3>
                    <ol class="flujo__pasos">
                        <li>Se inscribe</li>
                        <li>Sube documentos</li>
                        <li>Secretaría revisa a mano</li>
                        <li>Se le pide el pago</li>
                    </ol>
                </div>
                <div class="flujo flujo--nuevo">
                    <h3 class="flujo__titulo">Flujo propuesto</h3>
                    <ol class="flujo__pasos">
                        <li>Preinscripción ligera</li>
                        <li>Paga la matrícula</li>
                        <li class="flujo__hito">Vacante confirmada</li>
                        <li>Carga la documentación</li>
                    </ol>
                </div>
            </div>

            <p class="regla reveal"><strong>Pago acreditado = vacante confirmada.</strong> Es la regla central que definió la Dirección de la carrera. La documentación se revisa después, y el sistema no deja que una Postulación salte pasos.</p>
        </div>
    </section>

    <!-- Cómo funciona -->
    <section class="section" id="como-funciona" aria-labelledby="como-titulo">
        <div class="container split split--ancho">
            <div class="split__intro reveal">
                <h2 id="como-titulo">Cómo funciona</h2>
                <p>Cada persona sigue el mismo recorrido, y Tesorería y Secretaría trabajan sobre la misma información.</p>
                <p class="nota">Las pantallas del sistema son un prototipo del recorrido. Los datos que muestran son de ejemplo.</p>
                <a class="btn btn--primary" href="<?= e(SISTEMA_URL) ?>">
                    Recorrer el sistema
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </a>
            </div>
            <ol class="pasos reveal">
                <li class="pasos__item">
                    <h3>Preinscripción</h3>
                    <p>La persona carga sus datos mínimos, conoce los requisitos y acepta las condiciones antes de pagar.</p>
                </li>
                <li class="pasos__item">
                    <h3>Pago</h3>
                    <p>Puede pagar online o en la ventanilla de Tesorería. El sistema le muestra su ID de Postulación.</p>
                </li>
                <li class="pasos__item pasos__item--hito">
                    <h3>Acreditación</h3>
                    <p>Cuando el pago se acredita, ya sea por la pasarela de pago o por el listado que Tesorería sube una vez por día, la vacante queda confirmada.</p>
                </li>
                <li class="pasos__item">
                    <h3>Documentación</h3>
                    <p>Con la vacante asegurada, la persona sube los documentos requeridos. Secretaría los revisa y puede pedir correcciones.</p>
                </li>
                <li class="pasos__item">
                    <h3>Seguimiento</h3>
                    <p>En todo momento puede ver en qué estado está su trámite y qué le falta.</p>
                </li>
            </ol>
        </div>
    </section>

    <!-- Qué cambia para cada rol -->
    <section class="section section--blanca" aria-labelledby="roles-titulo">
        <div class="container">
            <h2 id="roles-titulo" class="reveal">Qué cambia para cada rol</h2>
            <dl class="roles reveal">
                <div class="roles__item"><dt>Postulantes</dt><dd>Saben qué falta y en qué estado está su trámite, sin depender de mails sueltos.</dd></div>
                <div class="roles__item"><dt>Secretaría TUP</dt><dd>Revisa documentación solo de quienes ya confirmaron su vacante, y queda registrado quién aprobó cada documento.</dd></div>
                <div class="roles__item"><dt>Tesorería</dt><dd>Sube un listado por día y el sistema acredita los pagos, sin cruzar comprobantes a mano.</dd></div>
                <div class="roles__item"><dt>Dirección</dt><dd>Ve cuántas personas pagaron y cuántas vacantes están confirmadas, sin recuentos manuales.</dd></div>
            </dl>
        </div>
    </section>

    <!-- Tecnología -->
    <section class="section" id="tecnologia" aria-labelledby="tecnologia-titulo">
        <div class="container split">
            <div class="split__intro reveal">
                <h2 id="tecnologia-titulo">Las reglas del negocio no dependen de la tecnología</h2>
                <p>El sistema usa arquitectura hexagonal: las reglas viven en el centro y todo lo de afuera (pantallas, base de datos, pasarela de pago) se conecta por puertos. Si una de esas piezas cambia, el negocio no se toca.</p>
                <p>La integración con la facultad es solo por archivo: el sistema no lee ni escribe en SysAdmin ni en SysAcad.</p>
            </div>
            <div class="reveal">
                <div class="capas" role="img" aria-label="Tres capas concéntricas: adaptadores por fuera, casos de uso en el medio y dominio en el centro">
                    <div class="capas__anillo capas__anillo--externo">
                        <span class="capas__nombre">Adaptadores</span>
                        <span class="capas__detalle">Pantallas, base de datos, pagos, informes</span>
                        <div class="capas__anillo capas__anillo--medio">
                            <span class="capas__nombre">Casos de uso</span>
                            <div class="capas__anillo capas__anillo--centro">
                                <span class="capas__nombre">Dominio</span>
                                <span class="capas__detalle">Reglas del negocio</span>
                            </div>
                        </div>
                    </div>
                </div>
                <dl class="stack">
                    <div class="stack__item"><dt>Interfaz</dt><dd>Next.js, React, TypeScript, Tailwind CSS y shadcn/ui</dd></div>
                    <div class="stack__item"><dt>Datos</dt><dd>Supabase (PostgreSQL, autenticación y almacenamiento)</dd></div>
                    <div class="stack__item"><dt>Calidad</dt><dd>Zod para validar datos externos y Vitest para las pruebas</dd></div>
                    <div class="stack__item"><dt>Este sitio</dt><dd>HTML, CSS, JavaScript y PHP, con Supabase como base de datos</dd></div>
                </dl>
            </div>
        </div>
    </section>

    <!-- Cierre -->
    <section class="banda-azul cierre" aria-labelledby="cierre-titulo">
        <div class="container cierre__grid">
            <h2 id="cierre-titulo">Recorré el proceso como lo haría una persona que se inscribe</h2>
            <div class="cierre__acciones">
                <a class="btn btn--blanco" href="<?= e(SISTEMA_URL) ?>">
                    Ir al sistema de inscripción
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </a>
                <a class="cierre__enlace" href="#/contacto" data-ruta="contacto">Escribinos tu consulta</a>
            </div>
        </div>
    </section>
</section>
