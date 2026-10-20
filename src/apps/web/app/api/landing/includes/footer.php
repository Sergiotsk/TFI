</main>

<footer class="site-footer">
    <div class="container site-footer__grid">
        <div>
            <p class="site-footer__nombre"><?= e(PROYECTO_NOMBRE) ?></p>
            <p class="site-footer__texto">Trabajo Final Integrador del Equipo 5. Tecnicatura Universitaria en Programación, UTN Facultad Regional Haedo.</p>
            <p class="site-footer__texto"><?= e(SEDE_DIRECCION) ?></p>
        </div>
        <ul class="site-footer__enlaces">
            <li><a href="#/" data-ruta="home">Inicio</a></li>
            <li><a href="#/institucion" data-ruta="institucion">Institución</a></li>
            <li><a href="#/nosotros" data-ruta="nosotros">Sobre nosotros</a></li>
            <li><a href="#/contacto" data-ruta="contacto">Contacto</a></li>
            <li><a href="<?= e(SISTEMA_URL) ?>">Sistema de inscripción</a></li>
        </ul>
    </div>
</footer>

<!-- Botón fijo para celulares: el acceso al sistema siempre está a mano -->
<a class="cta-movil" href="<?= e(SISTEMA_URL) ?>">Ir al sistema de inscripción</a>

<script src="assets/js/main.js"></script>
</body>
</html>
