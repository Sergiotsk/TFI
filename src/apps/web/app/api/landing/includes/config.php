<?php
/**
 * Configuración central del sitio de presentación.
 * Lo que puede cambiar (nombre, links, equipo, contacto) vive acá.
 * Los secretos (claves de Supabase) NO van acá: van en config.local.php, que Git ignora.
 */

// Nombre del producto: pendiente de definir (ver documento de seguimiento).
define('PROYECTO_NOMBRE', 'Sistema de Ingreso TUP');

// Destino de todos los botones "Ir al sistema de inscripción".
// Hoy apunta a los prototipos de docs/prototipos. Se puede sobrescribir con la variable de entorno SISTEMA_URL.
define('SISTEMA_URL', getenv('SISTEMA_URL') ?: '../docs/prototipos/index.html');

// Sede y enlaces institucionales.
define('SEDE_DIRECCION', 'París 532, Haedo, Buenos Aires');
define('SEDE_MAPA_URL', 'https://www.google.com/maps?q=UTN+Facultad+Regional+Haedo,+Par%C3%ADs+532,+Haedo&output=embed');
define('SEDE_MAPA_LINK', 'https://www.google.com/maps/search/?api=1&query=UTN+Facultad+Regional+Haedo+Par%C3%ADs+532+Haedo');
define('FRH_SITIO', 'https://frh.utn.edu.ar');
define('UTN_SITIO', 'https://www.utn.edu.ar');

// Imágenes oficiales: se copian a assets/img/ con estos nombres (si no están, se ve un marcador).
define('IMG_LOGO', 'logo-utn-frh.png');

// Contacto: dirección simulada (la consigna del parcial pide una dirección simulada del sitio).
define('CONTACTO_DESTINO', 'consultas@sistema-ingreso-tup.example');
define('CONTACTO_ORIGEN', 'no-responder@sistema-ingreso-tup.example');

// Motivos de consulta del formulario (clave => texto). Es la única fuente: la usan la vista y el backend.
const ASUNTOS = [
    'inscripcion' => 'Consulta sobre el proceso de inscripción',
    'proyecto'    => 'Consulta sobre el proyecto',
    'equipo'      => 'Quiero contactar al equipo',
    'otro'        => 'Otro motivo',
];

// Equipo. Cada integrante completa su resumen, tecnologías y links.
//   foto: nombre del archivo dentro de assets/img/ (ej. 'federico.jpg'); si no existe, se muestra la inicial.
const EQUIPO = [
    [
        'nombre' => 'Federico De Vivo',
        'rol' => 'Frontend',
        'foto' => 'federico.jpg',
        'resumen' => 'Desarrollo de las interfaces del sistema y de este sitio de presentación.',
        'tecnologias' => [],
        'github' => '',
        'linkedin' => '',
    ],
    [
        'nombre' => 'Lucia Enriquez Aveiro',
        'rol' => 'Frontend',
        'foto' => 'lucia.jpg',
        'resumen' => 'Desarrollo de las interfaces del sistema y de este sitio de presentación.',
        'tecnologias' => [],
        'github' => '',
        'linkedin' => '',
    ],
    [
        'nombre' => 'Santiago Vadone',
        'rol' => 'Backend',
        'foto' => 'santiago.jpg',
        'resumen' => 'Desarrollo de la lógica del sistema y de la base de datos.',
        'tecnologias' => [],
        'github' => '',
        'linkedin' => '',
    ],
    [
        'nombre' => 'Sergio Tschernitschek',
        'rol' => 'Backend',
        'foto' => 'sergio.jpg',
        'resumen' => 'Desarrollo de la lógica del sistema y de la base de datos.',
        'tecnologias' => [],
        'github' => '',
        'linkedin' => '',
    ],
];
const DOCENTE = 'Lic. Leila Coronel';

// Secretos locales (no se suben a Git). Ver includes/config.local.example.php
$local = __DIR__ . '/config.local.php';
if (is_file($local)) {
    require $local;
}
foreach (['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'] as $clave) {
    if (!defined($clave)) {
        define($clave, '');
    }
}

/** Escapa texto para imprimirlo de forma segura en HTML. */
function e(string $texto): string
{
    return htmlspecialchars($texto, ENT_QUOTES, 'UTF-8');
}

/** Cantidad de caracteres (no bytes) de un texto UTF-8. No depende de la extensión mbstring. */
function largo(string $texto): int
{
    return preg_match_all('/./us', $texto) ?: 0;
}

/** Primera letra de un texto UTF-8, para el avatar de cada integrante. */
function primera_letra(string $texto): string
{
    return preg_match('/./us', $texto, $m) ? $m[0] : '';
}

/** Devuelve la ruta pública de una imagen de assets/img/. */
function img(string $archivo): string
{
    return 'assets/img/' . rawurlencode($archivo);
}
