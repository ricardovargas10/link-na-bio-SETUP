<?php
/**
 * Instalador do link na bio (abrir uma vez no navegador: /instalar.php).
 *
 * 1ª vez: pede os dados do banco MySQL da Hostinger e o usuário/senha do painel;
 *         cria as tabelas, grava o conteúdo inicial e salva a configuração (fora da pasta pública quando dá).
 * Depois: fica trancado. Só permite trocar a senha do painel, e para isso pede a senha do banco.
 * Nenhuma senha aparece na tela, em log ou no GitHub.
 */
declare(strict_types=1);

require_once __DIR__ . '/api/lib/bootstrap.php';

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow, noarchive');
header("Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");

session_name('setup_instalar');
session_set_cookie_params(['path' => '/', 'secure' => setup_is_https(), 'httponly' => true, 'samesite' => 'Strict']);
session_start();
if (empty($_SESSION['t'])) {
    $_SESSION['t'] = bin2hex(random_bytes(16));
}
$token = $_SESSION['t'];

$installed = setup_config() !== null;
$errors = [];
$done = null;
$post = $_SERVER['REQUEST_METHOD'] === 'POST';

function field(string $k): string
{
    $v = $_POST[$k] ?? '';
    return is_string($v) ? trim($v) : '';
}

function check_admin(string $user, string $pass, string $pass2, array &$errors): void
{
    if (!preg_match('/^[A-Za-z0-9._-]{3,40}$/', $user)) {
        $errors[] = 'Usuário do painel: de 3 a 40 letras, números, ponto, - ou _ (sem espaço e sem acento).';
    }
    if (strlen($pass) < 10 || strlen($pass) > 200) {
        $errors[] = 'A senha do painel precisa ter pelo menos 10 caracteres.';
    } elseif (!hash_equals($pass, $pass2)) {
        $errors[] = 'As senhas do painel não são iguais.';
    }
}

/** Bloqueio simples de tentativas (usa a mesma tabela do login). */
function installer_blocked(PDO $db): bool
{
    $ip = 'instalar:' . setup_client_ip();
    $st = $db->prepare('SELECT COUNT(*) FROM setup_login_attempts WHERE ip = ? AND at > (UTC_TIMESTAMP() - INTERVAL 15 MINUTE)');
    $st->execute([$ip]);
    if ((int) $st->fetchColumn() >= 5) {
        return true;
    }
    $db->prepare('INSERT INTO setup_login_attempts (ip, at) VALUES (?, UTC_TIMESTAMP())')->execute([$ip]);
    return false;
}

function save_admin(PDO $db, string $user, string $pass): void
{
    $hash = password_hash($pass, PASSWORD_BCRYPT, ['cost' => 12]);
    $db->exec('DELETE FROM setup_admins');
    $db->prepare('INSERT INTO setup_admins (username, password_hash) VALUES (?, ?)')->execute([$user, $hash]);
}

if ($post) {
    $sameOrigin = ($_SERVER['HTTP_ORIGIN'] ?? '') === '' || parse_url((string) $_SERVER['HTTP_ORIGIN'], PHP_URL_HOST) === parse_url('http://' . ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST);
    if (!hash_equals($token, field('t')) || !$sameOrigin) {
        $errors[] = 'A página expirou. Recarregue e tente de novo.';
    }
}

if ($post && !$errors && !$installed) {
    // ---------- primeira instalação ----------
    $db = ['host' => field('db_host') ?: 'localhost', 'port' => (int) (field('db_port') ?: 3306), 'name' => field('db_name'), 'user' => field('db_user'), 'pass' => (string) ($_POST['db_pass'] ?? '')];
    $user = field('admin_user');
    $pass = (string) ($_POST['admin_pass'] ?? '');
    $pass2 = (string) ($_POST['admin_pass2'] ?? '');

    // Só banco no próprio servidor: ninguém consegue "instalar" apontando para um banco de fora.
    if (!in_array(strtolower($db['host']), ['localhost', '127.0.0.1', '::1'], true)) {
        $errors[] = 'Servidor do banco: use "localhost" (é o que a Hostinger informa).';
    }
    if ($db['name'] === '' || $db['user'] === '') {
        $errors[] = 'Preencha o nome do banco e o usuário do banco.';
    }
    check_admin($user, $pass, $pass2, $errors);

    if (!$errors) {
        try {
            $pdo = new PDO(sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $db['host'], $db['port'], $db['name']), $db['user'], $db['pass'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 5,
            ]);
        } catch (PDOException) {
            $errors[] = 'Não consegui entrar no banco com esses dados. Confira o nome do banco, o usuário e a senha no hPanel (Bancos de dados → MySQL).';
        }
    }

    if (!$errors) {
        $schema = (string) file_get_contents(__DIR__ . '/api/lib/schema.sql');
        foreach (array_filter(array_map('trim', explode(';', preg_replace('/^--.*$/m', '', $schema)))) as $sql) {
            $pdo->exec($sql);
        }
        // Conteúdo inicial: só se ainda não existir (reinstalar não apaga nada).
        $defaults = json_decode((string) file_get_contents(__DIR__ . '/api/lib/padrao.json'), true);
        $ins = $pdo->prepare('INSERT IGNORE INTO setup_kv (k, v) VALUES (?, ?)');
        foreach (['page', 'buttons', 'socials'] as $k) {
            $ins->execute([$k, json_encode($defaults[$k], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
        }
        save_admin($pdo, $user, $pass);

        $config = "<?php\n// Gerado pelo instalar.php em " . date('Y-m-d H:i') . ". Não envie para o GitHub.\nreturn " . var_export(['db' => $db], true) . ";\n";
        $written = null;
        foreach (setup_config_paths() as $path) {
            if (@file_put_contents($path, $config, LOCK_EX) !== false) {
                @chmod($path, 0600);
                $written = $path;
                break;
            }
        }
        if ($written === null) {
            $errors[] = 'Instalei o banco, mas não consegui salvar o arquivo de configuração. Confira as permissões da pasta no Gerenciador de Arquivos.';
        } else {
            $done = 'instalado';
            $installed = true;
        }
    }
} elseif ($post && !$errors && $installed) {
    // ---------- trocar a senha do painel ----------
    $c = setup_config();
    $user = field('admin_user');
    $pass = (string) ($_POST['admin_pass'] ?? '');
    $pass2 = (string) ($_POST['admin_pass2'] ?? '');
    try {
        $pdo = setup_db();
        if (installer_blocked($pdo)) {
            $errors[] = 'Muitas tentativas. Espere 15 minutos.';
        } elseif (!hash_equals((string) $c['db']['pass'], (string) ($_POST['db_pass'] ?? ''))) {
            $errors[] = 'A senha do banco não confere.';
        } else {
            check_admin($user, $pass, $pass2, $errors);
            if (!$errors) {
                save_admin($pdo, $user, $pass);
                $done = 'senha';
            }
        }
    } catch (Throwable) {
        $errors[] = 'Não consegui falar com o banco agora. Tente de novo em instantes.';
    }
}
?>
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Instalar · Link na bio Set Up</title>
<style>
  *{box-sizing:border-box} body{margin:0;background:#f7f4f2;color:#291d29;font:16px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif}
  main{max-width:520px;margin:0 auto;padding:32px 16px 64px} h1{font-size:24px;margin:0 0 4px} h2{font-size:17px;margin:24px 0 8px}
  .card{background:#fff;border:1px solid #ece6e7;border-radius:18px;padding:20px;box-shadow:0 1px 2px rgba(41,29,41,.05)}
  label{display:block;font-weight:600;font-size:14.5px;margin-top:14px} small{display:block;color:#6b5f6b;font-weight:400;font-size:13px;margin-top:4px}
  input{display:block;width:100%;min-height:48px;margin-top:6px;padding:0 14px;border:1.5px solid #d9d0d2;border-radius:14px;font-size:16px;background:#fff}
  input:focus{outline:3px solid #f05924;outline-offset:1px;border-color:#291d29}
  button{margin-top:22px;width:100%;min-height:52px;border:0;border-radius:14px;background:#291d29;color:#fff;font-size:16px;font-weight:600;cursor:pointer}
  .err{background:#fdecea;border:1px solid #f3cfcb;color:#8c1d16;border-radius:14px;padding:12px 14px;font-weight:600;margin:16px 0}
  .ok{background:#e6f4ea;border:1px solid #c7e6d2;color:#15603a;border-radius:14px;padding:14px;font-weight:600;margin:16px 0}
  .muted{color:#6b5f6b;font-size:14px} a{color:#291d29;font-weight:600}
</style>
</head>
<body>
<main>
  <h1>Link na bio · Set Up</h1>
  <p class="muted"><?= $installed ? 'Já está instalado.' : 'Instalação: leva 1 minuto.' ?></p>

<?php foreach ($errors as $err): ?>
  <p class="err"><?= e($err) ?></p>
<?php endforeach; ?>

<?php if ($done === 'instalado'): ?>
  <p class="ok">Pronto! O banco foi criado e o painel está funcionando.</p>
  <div class="card">
    <p>Entre no painel em <a href="/admin-setup/login/">/admin-setup</a> com o usuário e a senha que você acabou de criar.</p>
    <p class="muted">Este instalador agora fica trancado. Ele só serve para trocar a senha do painel (pedindo a senha do banco).</p>
  </div>
<?php elseif ($done === 'senha'): ?>
  <p class="ok">Senha do painel trocada.</p>
  <div class="card"><p>Entre no painel em <a href="/admin-setup/login/">/admin-setup</a> com a senha nova.</p></div>
<?php elseif (!$installed): ?>
  <form method="post" class="card" autocomplete="off">
    <input type="hidden" name="t" value="<?= e($token) ?>">
    <h2 style="margin-top:0">1. Banco de dados</h2>
    <p class="muted">Crie o banco no hPanel da Hostinger em <b>Bancos de dados → MySQL</b> e copie os dados aqui.</p>
    <label>Nome do banco <input name="db_name" required value="<?= e(field('db_name')) ?>" placeholder="u123456789_links"></label>
    <label>Usuário do banco <input name="db_user" required value="<?= e(field('db_user')) ?>" placeholder="u123456789_setup"></label>
    <label>Senha do banco <input name="db_pass" type="password" required></label>
    <label>Servidor <input name="db_host" value="<?= e(field('db_host') ?: 'localhost') ?>"><small>Deixe "localhost".</small></label>
    <input type="hidden" name="db_port" value="3306">

    <h2>2. Acesso ao painel</h2>
    <label>Usuário do painel <input name="admin_user" required autocapitalize="none" value="<?= e(field('admin_user')) ?>" placeholder="setup"></label>
    <label>Senha do painel <input name="admin_pass" type="password" required minlength="10"><small>Pelo menos 10 caracteres.</small></label>
    <label>Repita a senha <input name="admin_pass2" type="password" required minlength="10"></label>
    <button type="submit">Instalar</button>
  </form>
<?php else: ?>
  <form method="post" class="card" autocomplete="off">
    <input type="hidden" name="t" value="<?= e($token) ?>">
    <h2 style="margin-top:0">Trocar a senha do painel</h2>
    <p class="muted">Para confirmar que é você, digite a senha do banco de dados (a mesma usada na instalação).</p>
    <label>Senha do banco <input name="db_pass" type="password" required></label>
    <label>Usuário do painel <input name="admin_user" required autocapitalize="none" value="<?= e(field('admin_user')) ?>"></label>
    <label>Nova senha do painel <input name="admin_pass" type="password" required minlength="10"><small>Pelo menos 10 caracteres.</small></label>
    <label>Repita a nova senha <input name="admin_pass2" type="password" required minlength="10"></label>
    <button type="submit">Trocar senha</button>
  </form>
<?php endif; ?>
</main>
</body>
</html>
