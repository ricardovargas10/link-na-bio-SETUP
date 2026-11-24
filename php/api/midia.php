<?php
/**
 * Entrega as imagens enviadas pelo painel: /media/<id> (o .htaccess manda para cá).
 */
declare(strict_types=1);

require_once __DIR__ . '/lib/conteudo.php';

$id = is_string($_GET['id'] ?? null) ? $_GET['id'] : '';
if (!preg_match('/^img-[a-f0-9]{12}$/', $id)) {
    http_response_code(404);
    exit('Não encontrado');
}

try {
    $media = setup_media_get($id);
} catch (Throwable) {
    http_response_code(503);
    exit('Indisponível');
}
if (!$media) {
    http_response_code(404);
    exit('Não encontrado');
}

header('Content-Type: ' . $media['type']);
header('Content-Length: ' . strlen($media['data']));
// Cada imagem tem um id novo, então pode ficar em cache por muito tempo.
header('Cache-Control: public, max-age=31536000, immutable');
header('X-Content-Type-Options: nosniff');
// SVG nunca executa script, mesmo aberto direto no navegador.
header("Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; sandbox");
echo $media['data'];
