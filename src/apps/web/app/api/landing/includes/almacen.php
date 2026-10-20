<?php
/**
 * Dónde se guardan las consultas del formulario de contacto.
 *  - Con Supabase configurado: inserta en la tabla consultas_contacto por la API REST.
 *  - Sin configurar: modo de prueba local, en storage/consultas.jsonl.
 */

/** @return array{ok: bool, modo: string} */
function guardar_consulta(array $c): array
{
    if (SUPABASE_URL !== '' && SUPABASE_SERVICE_KEY !== '') {
        return ['ok' => guardar_en_supabase($c), 'modo' => 'supabase'];
    }
    return ['ok' => guardar_local($c), 'modo' => 'local'];
}

function guardar_en_supabase(array $c): bool
{
    $url = rtrim(SUPABASE_URL, '/') . '/rest/v1/consultas_contacto';
    $contexto = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => implode("\r\n", [
                'Content-Type: application/json',
                'apikey: ' . SUPABASE_SERVICE_KEY,
                'Authorization: Bearer ' . SUPABASE_SERVICE_KEY,
                'Prefer: return=minimal',
            ]),
            'content' => json_encode([
                'nombre' => $c['nombre'],
                'email' => $c['email'],
                'asunto' => $c['asunto'],
                'mensaje' => $c['mensaje'],
            ], JSON_UNESCAPED_UNICODE),
            'timeout' => 10,
            'ignore_errors' => true,
        ],
    ]);

    $respuesta = @file_get_contents($url, false, $contexto);
    $estado = 0;
    if (isset($http_response_header[0]) && preg_match('#\s(\d{3})\s#', $http_response_header[0], $m)) {
        $estado = (int) $m[1];
    }
    if ($estado >= 200 && $estado < 300) {
        return true;
    }
    // El detalle queda en el log del servidor; al visitante nunca se le muestra.
    error_log('Supabase rechazó la consulta de contacto (HTTP ' . $estado . '): ' . substr((string) $respuesta, 0, 300));
    return false;
}

function guardar_local(array $c): bool
{
    $carpeta = __DIR__ . '/../storage';
    if (!is_dir($carpeta) && !@mkdir($carpeta, 0775, true)) {
        return false;
    }
    $linea = json_encode($c + ['creado_en' => date('c')], JSON_UNESCAPED_UNICODE) . "\n";
    return @file_put_contents($carpeta . '/consultas.jsonl', $linea, FILE_APPEND | LOCK_EX) !== false;
}

/** Envía el aviso por mail a la dirección simulada. Devuelve false si el servidor no tiene correo configurado. */
function enviar_aviso(array $c): bool
{
    $asunto = '=?UTF-8?B?' . base64_encode('[Contacto] ' . ASUNTOS[$c['asunto']]) . '?=';
    $cuerpo = "Nombre: {$c['nombre']}\nEmail: {$c['email']}\nMotivo: " . ASUNTOS[$c['asunto']] . "\n\n{$c['mensaje']}\n";
    $cabeceras = implode("\r\n", [
        'From: ' . CONTACTO_ORIGEN,
        'Reply-To: ' . $c['email'], // ya validado con FILTER_VALIDATE_EMAIL: no admite saltos de línea
        'Content-Type: text/plain; charset=UTF-8',
    ]);
    return @mail(CONTACTO_DESTINO, $asunto, $cuerpo, $cabeceras);
}
