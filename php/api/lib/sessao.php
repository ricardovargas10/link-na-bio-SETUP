<?php
/**
 * Login, sessão, proteção contra envio de outro site (CSRF) e bloqueio de tentativas.
 * - Senha só como hash bcrypt (password_hash / password_verify).
 * - Cookie httpOnly, secure (em HTTPS), SameSite=Strict, válido por 8 horas.
 * - 5 tentativas erradas em 15 minutos bloqueiam o IP por 15 minutos.
 */
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

const SETUP_SESSION_TTL = 8 * 60 * 60;
const SETUP_MAX_ATTEMPTS = 5;
const SETUP_WINDOW_MIN = 15;
const SETUP_LOGIN_ERROR = 'Usuário ou senha incorretos';
// Hash de uma senha aleatória: gasta o mesmo tempo quando o usuário não existe.
const SETUP_DUMMY_HASH = '$2y$12$Glf1MG6fqaO4KJE/zpk7Gu1kZCSTABMNcOTWNIE73x/eQGqyLentS';

function setup_session_start(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.gc_maxlifetime', (string) SETUP_SESSION_TTL);
    session_name('setup_painel');
    session_set_cookie_params([
        'lifetime' => SETUP_SESSION_TTL,
        'path' => '/',
        'secure' => setup_is_https(),
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
}

/** Usuário logado (sessão válida e dentro das 8 horas) ou null. */
function setup_current_user(): ?string
{
    setup_session_start();
    $user = $_SESSION['user'] ?? null;
    $at = (int) ($_SESSION['login_at'] ?? 0);
    if (!is_string($user) || $at <= 0 || time() - $at > SETUP_SESSION_TTL) {
        return null;
    }
    return $user;
}

function setup_csrf(): string
{
    setup_session_start();
    if (empty($_SESSION['csrf']) || !is_string($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

/** O pedido veio deste mesmo site? (cabeçalho Origin, quando o navegador manda) */
function setup_same_origin(): bool
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin === '') {
        return true;
    }
    $host = $_SERVER['HTTP_HOST'] ?? '';
    return parse_url($origin, PHP_URL_HOST) . (parse_url($origin, PHP_URL_PORT) ? ':' . parse_url($origin, PHP_URL_PORT) : '') === $host;
}

/** Toda escrita do painel passa por aqui: sem sessão válida, 401 e nenhum dado. */
function setup_require_admin(bool $write = true): string
{
    $user = setup_current_user();
    if ($user === null) {
        setup_fail('Sessão expirada. Entre de novo no painel.', 401);
    }
    if ($write) {
        $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        if (!setup_same_origin() || !is_string($token) || !hash_equals(setup_csrf(), $token)) {
            setup_fail('Sessão expirada. Entre de novo no painel.', 401);
        }
    }
    return $user;
}

/** Conta uma tentativa de login. Devolve null se pode tentar, ou os minutos de espera. */
function setup_login_blocked_minutes(string $ip): ?int
{
    $db = setup_db();
    $db->exec("DELETE FROM setup_login_attempts WHERE at < (UTC_TIMESTAMP() - INTERVAL 1 DAY)");
    $st = $db->prepare('SELECT COUNT(*), MIN(at) FROM setup_login_attempts WHERE ip = ? AND at > (UTC_TIMESTAMP() - INTERVAL ' . SETUP_WINDOW_MIN . ' MINUTE)');
    $st->execute([$ip]);
    [$count, $oldest] = $st->fetch(PDO::FETCH_NUM);
    if ((int) $count >= SETUP_MAX_ATTEMPTS) {
        $wait = (int) ceil((strtotime($oldest . ' UTC') + SETUP_WINDOW_MIN * 60 - time()) / 60);
        return max(1, $wait);
    }
    $db->prepare('INSERT INTO setup_login_attempts (ip, at) VALUES (?, UTC_TIMESTAMP())')->execute([$ip]);
    return null;
}

/** Confere usuário e senha em tempo constante (sempre roda o bcrypt). */
function setup_check_credentials(string $username, string $password): bool
{
    $st = setup_db()->prepare('SELECT username, password_hash FROM setup_admins');
    $st->execute();
    $found = null;
    foreach ($st->fetchAll() as $row) {
        if (hash_equals(hash('sha256', (string) $row['username']), hash('sha256', $username))) {
            $found = $row;
        }
    }
    $ok = password_verify($password, $found ? (string) $found['password_hash'] : SETUP_DUMMY_HASH);
    return $found !== null && $ok;
}

function setup_login(string $username, string $password): array
{
    $ip = setup_client_ip();
    $wait = setup_login_blocked_minutes($ip);
    if ($wait !== null) {
        return ['error' => "Muitas tentativas. Tente de novo em $wait min.", 'status' => 429];
    }
    if ($username === '' || $password === '' || mb_strlen($username) > 100 || strlen($password) > 200 || !setup_check_credentials($username, $password)) {
        return ['error' => SETUP_LOGIN_ERROR, 'status' => 401];
    }
    setup_db()->prepare('DELETE FROM setup_login_attempts WHERE ip = ?')->execute([$ip]);
    setup_session_start();
    session_regenerate_id(true);
    $_SESSION = ['user' => $username, 'login_at' => time()];
    return ['csrf' => setup_csrf()];
}

function setup_logout(): void
{
    setup_session_start();
    $_SESSION = [];
    $p = session_get_cookie_params();
    setcookie(session_name(), '', [
        'expires' => time() - 3600,
        'path' => $p['path'],
        'secure' => $p['secure'],
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_destroy();
}
