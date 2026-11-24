<?php
/**
 * Só para testar no computador: php -S localhost:8080 -t deploy scripts/servidor-local.php
 * Faz o papel do .htaccess (o servidor embutido do PHP não lê o .htaccess).
 */
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/');
$root = $_SERVER['DOCUMENT_ROOT'];

if (preg_match('#^/api/lib(/|$)#', $uri) || preg_match('#(^|/)\.#', $uri) || preg_match('#\.(sql|md|lock|log|ini)$#', $uri)) {
    http_response_code(404);
    readfile($root . '/404.html');
    return true;
}
if (preg_match('#^/(admin-setup|api|instalar\.php)#', $uri)) {
    header('X-Robots-Tag: noindex, nofollow, noarchive');
}
if (preg_match('#^/media/(img-[a-f0-9]{12})/?$#', $uri, $m)) {
    $_GET['id'] = $m[1];
    require $root . '/api/midia.php';
    return true;
}
if (preg_match('#^/(icon|apple-icon|opengraph-image)(\.png)?$#', $uri)) {
    header('Content-Type: image/png');
    readfile($root . $uri);
    return true;
}
$path = $root . $uri;
if (is_dir($path)) {
    foreach (['index.php', 'index.html'] as $idx) {
        if (is_file(rtrim($path, '/') . '/' . $idx)) {
            if (!str_ends_with($uri, '/')) {
                header('Location: ' . $uri . '/', true, 301);
                return true;
            }
            if ($idx === 'index.php') {
                chdir(rtrim($path, '/'));
                require rtrim($path, '/') . '/index.php';
                return true;
            }
            header('Content-Type: text/html; charset=utf-8');
            readfile(rtrim($path, '/') . '/index.html');
            return true;
        }
    }
}
if (is_file($path)) {
    return false; // arquivo estático ou .php: o servidor embutido cuida
}
http_response_code(404);
header('Content-Type: text/html; charset=utf-8');
readfile($root . '/404.html');
return true;
