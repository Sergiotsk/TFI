<section class="vista" data-view="institucion" data-titulo="Institución" aria-labelledby="institucion-titulo">

    <div class="banda-azul cabecera-vista">
        <div class="container">
            <h1 id="institucion-titulo" tabindex="-1">La institución</h1>
            <p class="cabecera-vista__bajada">Este sistema nace dentro de la UTN Facultad Regional Haedo y está pensado para que lo use la propia Facultad.</p>
        </div>
    </div>

    <section class="section" aria-labelledby="utn-titulo">
        <div class="container split">
            <div class="split__intro reveal">
                <h2 id="utn-titulo">Una universidad nacional dedicada a la tecnología</h2>
                <p>La Universidad Tecnológica Nacional (UTN) se creó el 14 de octubre de 1959 por la ley 14.855. Su antecedente es la Universidad Obrera, que ya funcionaba con estructura universitaria desde 1953.</p>
            </div>
            <div class="texto-largo reveal">
                <p>Es la única universidad nacional del país cuya estructura académica tiene a las ingenierías como eje central, y tiene carácter federal: sus facultades regionales están repartidas en distintas ciudades de la Argentina, y cada una responde a las necesidades productivas de su zona.</p>
                <p><a class="enlace" href="<?= e(UTN_SITIO) ?>" target="_blank" rel="noopener">Sitio de la UTN</a></p>
            </div>
        </div>
    </section>

    <section class="section section--tinte" aria-labelledby="frh-titulo">
        <div class="container split">
            <div class="split__intro reveal">
                <h2 id="frh-titulo">Facultad Regional Haedo</h2>
                <p>Es parte de la comunidad de Haedo y fue reconocida como Facultad Regional en 1972. En 1983 inauguró su sede actual en París 532.</p>
            </div>
            <div class="texto-largo reveal">
                <p>Además de formar profesionales en ingeniería, la Facultad ofrece carreras de grado y posgrado y cursos, y trabaja con empresas e instituciones de la zona: brinda consultoría y arma propuestas de capacitación a medida.</p>
                <p>La oferta completa de carreras y cursos se consulta en el sitio de la Facultad.</p>
                <p><a class="enlace" href="<?= e(FRH_SITIO) ?>" target="_blank" rel="noopener">Sitio de la Facultad Regional Haedo</a></p>
            </div>
        </div>
    </section>

    <section class="section" aria-labelledby="tup-titulo">
        <div class="container split">
            <div class="split__intro reveal">
                <h2 id="tup-titulo">La Tecnicatura y este proyecto</h2>
                <p>El ingreso a la Tecnicatura Universitaria en Programación (TUP) hoy se gestiona con formularios, carpetas compartidas y planillas.</p>
            </div>
            <div class="texto-largo reveal">
                <p>Para entender el problema, el Equipo 5 habló con la Dirección de la carrera, con Secretaría y con el área de Sistemas y Administración. De esas entrevistas salió la regla central del sistema: el pago acreditado confirma la vacante, y la documentación se revisa después.</p>
                <p><a class="enlace" href="#/" data-ruta="home">Ver el problema y la solución</a></p>
            </div>
        </div>
    </section>

    <section class="section section--blanca" aria-labelledby="sede-titulo">
        <div class="container">
            <h2 id="sede-titulo" class="reveal">La sede</h2>
            <div class="galeria reveal">
                <figure class="foto foto--grande">
                    <img data-src="<?= e(img('facultad-1.jpg')) ?>" alt="UTN Facultad Regional Haedo" hidden>
                    <span class="foto__marcador">Foto de la Facultad</span>
                </figure>
                <figure class="foto">
                    <img data-src="<?= e(img('facultad-2.jpg')) ?>" alt="UTN Facultad Regional Haedo" hidden>
                    <span class="foto__marcador">Foto de la Facultad</span>
                </figure>
                <figure class="foto">
                    <img data-src="<?= e(img('facultad-3.jpg')) ?>" alt="UTN Facultad Regional Haedo" hidden>
                    <span class="foto__marcador">Foto de la Facultad</span>
                </figure>
            </div>
            <dl class="datos reveal">
                <div class="datos__item"><dt>Dirección</dt><dd><?= e(SEDE_DIRECCION) ?></dd></div>
                <div class="datos__item"><dt>Cómo llegar</dt><dd><a class="enlace" href="#/contacto" data-ruta="contacto">Ver el mapa</a></dd></div>
            </dl>
        </div>
    </section>
</section>
