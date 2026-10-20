<?php
/**
 * Copiá este archivo como config.local.php y completá los valores.
 * config.local.php NO se sube a Git (está en .gitignore).
 *
 * Supabase: Project Settings > API.
 *  - SUPABASE_URL: la "Project URL".
 *  - SUPABASE_SERVICE_KEY: la clave "service_role". Es SECRETA: solo la usa este backend PHP,
 *    nunca la pongas en JavaScript, en el chat ni en un commit.
 *
 * Si queda vacío, el formulario de contacto guarda las consultas en storage/consultas.jsonl (modo de prueba local).
 */
define('SUPABASE_URL', 'https://TU-PROYECTO.supabase.co');
define('SUPABASE_SERVICE_KEY', 'PEGAR-ACA-LA-SERVICE-ROLE-KEY');
