<?php
/**
 * Base de tudo: configuração, banco (PDO/MySQL) e utilitários.
 * Esta pasta (api/lib) é bloqueada para o navegador pelo .htaccess.
 * Nunca registre senha, hash ou token em log.
 */
declare(strict_types=1);

date_default_timezone_set('America/Sao_Paulo');
mb_internal_encoding('UTF-8');

const SETUP_ADMIN_PATH = '/admin-setup';
const SETUP_MEDIA_MAX = 600 * 1024;
const SETUP_MEDIA_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

/** Onde o instalar.php grava a configuração: fora da pasta pública quando dá. */
function setup_config_paths(): array
{
    $paths = [];
    $docRoot = $_SERVER['DOCUMENT_ROOT'] ?? '';
    if ($docRoot !== '') {
        $paths[] = dirname(rtrim($docRoot, '/\\')) . DIRECTORY_SEPARATOR . 'setup-config.php';
    }
    $paths[] = __DIR__ . DIRECTORY_SEPARATOR . 'config.local.php';
    return $paths;
}

/** Configuração gravada pelo instalar.php, ou null se ainda não instalado. */
function setup_config(): ?array
{
    static $config = false;
    if ($config !== false) {
        return $config;
    }
    $config = null;
    foreach (setup_config_paths() as $p) {
        if (is_file($p)) {
            $c = require $p;
            if (is_array($c) && isset($c['db'])) {
                $config = $c;
                break;
            }
        }
    }
    return $config;
}

final class SetupUnavailable extends RuntimeException
{
}

function setup_db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $c = setup_config();
    if (!$c) {
        throw new SetupUnavailable('Ainda não instalado');
    }
    $db = $c['db'];
    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $db['host'], (int) ($db['port'] ?? 3306), $db['name']);
    try {
        $pdo = new PDO($dsn, $db['user'], $db['pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_TIMEOUT => 5,
        ]);
    } catch (PDOException) {
        throw new SetupUnavailable('Banco indisponível');
    }
    return $pdo;
}

function setup_is_https(): bool
{
    if (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off') {
        return true;
    }
    if (strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https') {
        return true;
    }
    return (int) ($_SERVER['SERVER_PORT'] ?? 0) === 443;
}

/** IP de quem fez o pedido (para o bloqueio de tentativas de login). */
function setup_client_ip(): string
{
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    return $ip !== '' ? substr($ip, 0, 64) : 'desconhecido';
}

/** Data e hora agora em UTC, no formato ISO usado no JSON (igual ao do navegador). */
function setup_now_iso(): string
{
    return gmdate('Y-m-d\TH:i:s') . '.000Z';
}

/** Dia de hoje no horário de Brasília (AAAA-MM-DD). */
function setup_today(): string
{
    return date('Y-m-d');
}

function setup_new_id(string $prefix): string
{
    return $prefix . '-' . bin2hex(random_bytes(6));
}

function setup_json(int $status, array $body): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function setup_ok(mixed $data = null): never
{
    setup_json(200, $data === null ? ['ok' => true] : ['ok' => true, 'data' => $data]);
}

function setup_fail(string $error, int $status = 400, ?array $fieldErrors = null): never
{
    $body = ['ok' => false, 'error' => $error];
    if ($fieldErrors) {
        $body['fieldErrors'] = $fieldErrors;
    }
    setup_json($status, $body);
}

/** Escapa texto para HTML (todo texto vindo do banco passa por aqui). */
function e(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5, 'UTF-8');
}
