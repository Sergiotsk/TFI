<?php
session_start();
$_SESSION['cargada'] ??= time(); // el backend de contacto lo usa para descartar envíos instantáneos de bots

require __DIR__ . '/includes/config.php';
require __DIR__ . '/includes/header.php';

// Cuatro vistas dentro de una sola página: main.js muestra la que corresponde al hash (#/, #/institucion, ...).
require __DIR__ . '/views/home.php';
require __DIR__ . '/views/institucion.php';
require __DIR__ . '/views/nosotros.php';
require __DIR__ . '/views/contacto.php';

require __DIR__ . '/includes/footer.php';
