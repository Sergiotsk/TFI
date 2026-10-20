<section class="vista" data-view="contacto" data-titulo="Contacto" aria-labelledby="contacto-titulo">

    <div class="banda-azul cabecera-vista">
        <div class="container">
            <h1 id="contacto-titulo" tabindex="-1">Contacto</h1>
            <p class="cabecera-vista__bajada">¿Tenés una duda sobre el proceso de inscripción o sobre el proyecto? Escribinos y lo vemos.</p>
        </div>
    </div>

    <section class="section" aria-label="Formulario y ubicación">
        <div class="container contacto__grid">
            <form class="form reveal" id="form-contacto" data-endpoint="api/contacto.php" novalidate>
                <div class="campo">
                    <label for="c-nombre">Nombre</label>
                    <input id="c-nombre" name="nombre" type="text" autocomplete="name" maxlength="100" required aria-describedby="err-nombre">
                    <p class="campo__error" id="err-nombre" role="alert"></p>
                </div>
                <div class="campo">
                    <label for="c-email">Email</label>
                    <input id="c-email" name="email" type="email" autocomplete="email" maxlength="254" required aria-describedby="err-email">
                    <p class="campo__error" id="err-email" role="alert"></p>
                </div>
                <div class="campo">
                    <label for="c-asunto">Motivo de la consulta</label>
                    <select id="c-asunto" name="asunto" required aria-describedby="err-asunto">
                        <option value="">Elegí una opción</option>
                        <?php foreach (ASUNTOS as $clave => $texto): ?>
                            <option value="<?= e($clave) ?>"><?= e($texto) ?></option>
                        <?php endforeach; ?>
                    </select>
                    <p class="campo__error" id="err-asunto" role="alert"></p>
                </div>
                <div class="campo">
                    <label for="c-mensaje">Mensaje</label>
                    <textarea id="c-mensaje" name="mensaje" rows="6" maxlength="2000" required aria-describedby="err-mensaje ayuda-mensaje"></textarea>
                    <p class="campo__ayuda" id="ayuda-mensaje"><span id="contador">0</span> de 2000 caracteres</p>
                    <p class="campo__error" id="err-mensaje" role="alert"></p>
                </div>

                <!-- Trampa para bots: las personas no lo ven -->
                <div class="trampa" aria-hidden="true">
                    <label for="c-web">No completar este campo</label>
                    <input id="c-web" name="sitio_web" type="text" tabindex="-1" autocomplete="off">
                </div>

                <button class="btn btn--primary" type="submit">Enviar consulta</button>
                <p class="form__estado" id="form-estado" role="status" aria-live="polite"></p>
                <p class="campo__ayuda">Usamos tus datos solo para responder tu consulta.</p>
            </form>

            <div class="ubicacion reveal">
                <div class="mapa">
                    <iframe title="Mapa con la ubicación de la UTN Facultad Regional Haedo" src="<?= e(SEDE_MAPA_URL) ?>" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
                </div>
                <dl class="datos datos--vertical">
                    <div class="datos__item"><dt>UTN Facultad Regional Haedo</dt><dd><?= e(SEDE_DIRECCION) ?></dd></div>
                    <div class="datos__item"><dt>Cómo llegar</dt><dd><a class="enlace" href="<?= e(SEDE_MAPA_LINK) ?>" target="_blank" rel="noopener">Abrir en Google Maps</a></dd></div>
                </dl>
            </div>
        </div>
    </section>
</section>
