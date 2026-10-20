<?php
/** Encabezado común: <head>, barra superior con navegación y el botón al sistema. */
$descripcion = 'Sistema web para inscribirse a la Tecnicatura Universitaria en Programación de la UTN Facultad Regional Haedo: el pago confirma la vacante y la documentación se revisa después.';
?>
<!DOCTYPE html>
<html lang="es" class="no-js">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= e(PROYECTO_NOMBRE) ?> | Presentación del proyecto</title>
    <meta name="description" content="<?= e($descripcion) ?>">
    <script>document.documentElement.className = 'js';</script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&amp;family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/styles.css">
</head>
<body>
<a class="skip-link" href="#contenido">Saltar al contenido</a>

<header class="site-header">
    <div class="container site-header__barra">
        <a class="marca" href="#/" data-ruta="home" aria-label="<?= e(PROYECTO_NOMBRE) ?>, ir al inicio">
            <img class="marca__logo" data-src="<?= e(img(IMG_LOGO)) ?>" alt="UTN Facultad Regional Haedo" hidden>
            <span class="marca__fallback">
                <span class="marca__sello" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>
                </span>
                <span class="marca__nombre"><span class="marca__sigla">UTN<b>.FRH</b></span><small>HAEDO · TUP</small></span>
            </span>
        </a>

        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="menu-principal">Menú</button>

        <nav class="menu" id="menu-principal" aria-label="Principal">
            <ul class="menu__enlaces">
                <li><a href="#/" data-ruta="home">Inicio</a></li>
                <li><a href="#/institucion" data-ruta="institucion">Institución</a></li>
                <li><a href="#/nosotros" data-ruta="nosotros">Sobre nosotros</a></li>
                <li><a href="#/contacto" data-ruta="contacto">Contacto</a></li>
            </ul>
            <a class="btn btn--primary btn--chico" href="<?= e(SISTEMA_URL) ?>">
                Ir al sistema de inscripción
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </a>
        </nav>
    </div>
</header>

<main id="contenido">
