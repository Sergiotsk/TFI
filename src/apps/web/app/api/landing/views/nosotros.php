<section class="vista" data-view="nosotros" data-titulo="Sobre nosotros" aria-labelledby="nosotros-titulo">

    <div class="banda-azul cabecera-vista">
        <div class="container">
            <h1 id="nosotros-titulo" tabindex="-1">Sobre nosotros</h1>
            <p class="cabecera-vista__bajada">Somos el Equipo 5: cuatro estudiantes de la Tecnicatura Universitaria en Programación que diseñamos y construimos este sistema, con dos personas en el frontend y dos en el backend.</p>
        </div>
    </div>

    <section class="section" aria-labelledby="integrantes-titulo">
        <div class="container">
            <h2 id="integrantes-titulo" class="reveal">Quiénes somos</h2>
            <ul class="equipo">
                <?php foreach (EQUIPO as $i => $p): ?>
                    <li class="persona reveal">
                        <div class="persona__foto">
                            <span class="persona__inicial" aria-hidden="true"><?= e(primera_letra($p['nombre'])) ?></span>
                            <img data-src="<?= e(img($p['foto'])) ?>" alt="Foto de <?= e($p['nombre']) ?>" hidden>
                        </div>
                        <div class="persona__cuerpo">
                            <h3><?= e($p['nombre']) ?></h3>
                            <p class="pill"><?= e($p['rol']) ?></p>
                            <?php if ($p['resumen'] !== ''): ?>
                                <p class="persona__resumen"><?= e($p['resumen']) ?></p>
                            <?php endif; ?>
                            <?php if ($p['tecnologias']): ?>
                                <ul class="chips" aria-label="Tecnologías">
                                    <?php foreach ($p['tecnologias'] as $t): ?><li><?= e($t) ?></li><?php endforeach; ?>
                                </ul>
                            <?php endif; ?>
                            <?php if ($p['github'] !== '' || $p['linkedin'] !== ''): ?>
                                <p class="persona__links">
                                    <?php if ($p['github'] !== ''): ?><a class="enlace" href="<?= e($p['github']) ?>" target="_blank" rel="noopener">GitHub</a><?php endif; ?>
                                    <?php if ($p['linkedin'] !== ''): ?><a class="enlace" href="<?= e($p['linkedin']) ?>" target="_blank" rel="noopener">LinkedIn</a><?php endif; ?>
                                </p>
                            <?php endif; ?>
                        </div>
                    </li>
                <?php endforeach; ?>
            </ul>
        </div>
    </section>

    <section class="section section--tinte" aria-labelledby="contexto-titulo">
        <div class="container split">
            <div class="split__intro reveal">
                <h2 id="contexto-titulo">Un proyecto real</h2>
                <p>Este es el Trabajo Final Integrador de la Práctica Profesional Supervisada 2026 de la UTN Facultad Regional Haedo. Docente: <?= e(DOCENTE) ?>.</p>
            </div>
            <div class="texto-largo reveal">
                <p>Partimos de entrevistas con quienes gestionan el ingreso, definimos las reglas del negocio y las pantallas, y las llevamos a un sistema pensado para que la Facultad lo use.</p>
                <p><a class="enlace" href="#/contacto" data-ruta="contacto">Escribirle al equipo</a></p>
            </div>
        </div>
    </section>
</section>
