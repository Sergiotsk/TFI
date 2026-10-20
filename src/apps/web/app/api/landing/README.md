# Sitio de presentación del proyecto

SPA con cuatro vistas (Home, Institución, Sobre nosotros, Contacto) hecha con HTML, CSS, JavaScript y PHP.
La navegación usa el hash de la URL (`#/`, `#/institucion`, `#/nosotros`, `#/contacto`).
El login, la vista admin y el buscador viven en el sistema principal, no acá.

## Cómo probarlo

Desde la **raíz del repositorio** (así el botón encuentra los prototipos de `docs/prototipos`):

    php -S localhost:8000

y abrir http://localhost:8000/landing/index.php

## Estructura

    landing/
    ├── index.php               arma la página y carga las vistas
    ├── views/                  home.php, institucion.php, nosotros.php, contacto.php
    ├── includes/               config.php (datos), header.php, footer.php, almacen.php (guardado)
    ├── api/contacto.php        backend del formulario (valida, guarda, avisa por mail)
    ├── assets/                 css/styles.css, js/main.js, img/ (logo y fotos oficiales)
    ├── sql/consultas_contacto.sql
    └── storage/                consultas de prueba (solo sin Supabase)

## Qué se cambia dónde

- `includes/config.php`: nombre del producto, link al sistema, dirección, equipo (resumen, tecnologías, GitHub, LinkedIn).
- `assets/css/styles.css`: colores y tipografías en `:root`.
- `assets/img/`: logo y fotos. Nombres esperados: `logo-utn-frh.png`, `facultad-1.jpg`, `facultad-2.jpg`,
  `facultad-3.jpg`, `federico.jpg`, `lucia.jpg`, `santiago.jpg`, `sergio.jpg`. Si un archivo no está, se ve un marcador.

## Formulario de contacto con Supabase

1. En Supabase (SQL Editor) ejecutar `sql/consultas_contacto.sql`.
2. Copiar `includes/config.local.example.php` como `includes/config.local.php` y completar la URL y la clave `service_role`.
3. Esa clave es secreta: solo vive en ese archivo (Git lo ignora gracias a `landing/.gitignore`). Nunca va en JavaScript, en el chat ni en un commit.

Sin `config.local.php`, las consultas se guardan en `storage/consultas.jsonl` (modo de prueba).
El aviso por mail usa `mail()` hacia una dirección simulada; si el servidor no tiene correo configurado (XAMPP no lo trae),
la consulta igual queda guardada.
