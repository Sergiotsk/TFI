<?php
declare(strict_types=1);

/**
 * Recibe el formulario de contacto (JSON por POST), lo valida, lo guarda y avisa por mail.
 * Responde siempre JSON: { ok: bool, ... }
 */
require __DIR__ . '/../includes/config.php';
require __DIR__ . '/../includes/almacen.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function responder(int $codigo, array $datos): never
{
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    responder(405, ['ok' => false, 'mensaje' => 'Método no permitido.']);
}

session_start();

$datos = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($datos)) {
    $datos = $_POST;
}

// Trampa para bots: este campo está oculto para las personas. Si viene completo, se descarta en silencio.
if (!empty($datos['sitio_web'])) {
    responder(200, ['ok' => true]);
}

// Una persona tarda más de unos segundos entre cargar la página y enviar el formulario.
$cargada = $_SESSION['cargada'] ?? null;
if (!is_int($cargada) || time() - $cargada < 3) {
    responder(429, ['ok' => false, 'mensaje' => 'Esperá unos segundos y volvé a enviar el formulario.']);
}
$ultimo = $_SESSION['ultimo_envio'] ?? 0;
if (time() - (int) $ultimo < 30) {
    responder(429, ['ok' => false, 'mensaje' => 'Ya enviaste una consulta hace un momento. Probá de nuevo en unos segundos.']);
}

$nombre = trim((string) ($datos['nombre'] ?? ''));
$email = trim((string) ($datos['email'] ?? ''));
$asunto = (string) ($datos['asunto'] ?? '');
$mensaje = trim((string) ($datos['mensaje'] ?? ''));

$errores = [];
$largoNombre = largo($nombre);
if ($largoNombre < 2 || $largoNombre > 100) {
    $errores['nombre'] = 'Escribí tu nombre (entre 2 y 100 caracteres).';
}
if (largo($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errores['email'] = 'Ingresá un email válido.';
}
if (!array_key_exists($asunto, ASUNTOS)) {
    $errores['asunto'] = 'Elegí un motivo de consulta.';
}
$largoMensaje = largo($mensaje);
if ($largoMensaje < 10 || $largoMensaje > 2000) {
    $errores['mensaje'] = 'El mensaje debe tener entre 10 y 2000 caracteres.';
}
if ($errores) {
    responder(422, ['ok' => false, 'mensaje' => 'Revisá los campos marcados.', 'errores' => $errores]);
}

$consulta = ['nombre' => $nombre, 'email' => $email, 'asunto' => $asunto, 'mensaje' => $mensaje];

$guardado = guardar_consulta($consulta);
if (!$guardado['ok']) {
    responder(500, ['ok' => false, 'mensaje' => 'No pudimos guardar tu consulta. Probá de nuevo en un rato.']);
}

$_SESSION['ultimo_envio'] = time();
$mail = enviar_aviso($consulta);

responder(200, ['ok' => true, 'modo' => $guardado['modo'], 'mail' => $mail]);
