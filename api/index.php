<?php
/**
 * API do painel e da página: /api/?a=<ação>
 * Leitura (GET): sessao, dados. Escrita (POST): todo o resto.
 * Toda escrita do painel confere a sessão e o token CSRF; sem sessão, 401 e nenhum dado.
 */
declare(strict_types=1);

require_once __DIR__ . '/lib/conteudo.php';
require_once __DIR__ . '/lib/sessao.php';

header('X-Robots-Tag: noindex, nofollow, noarchive');
header('X-Content-Type-Options: nosniff');

$action = is_string($_GET['a'] ?? null) ? $_GET['a'] : '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if (!setup_config()) {
    setup_fail('O painel ainda não foi instalado. Abra /instalar.php.', 503);
}

/** Corpo JSON das ações rápidas. */
function setup_body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function setup_id_from(array $src): string
{
    $id = $src['id'] ?? '';
    if (!setup_is_id($id)) {
        setup_fail('Pedido inválido.');
    }
    return $id;
}

/** Apaga a imagem antiga quando o ícone mudou. */
function setup_cleanup_icon(?array $before, ?array $after): void
{
    if (($before['type'] ?? null) === 'custom' && !(($after['type'] ?? null) === 'custom' && $after['mediaId'] === $before['mediaId'])) {
        setup_media_delete($before['mediaId']);
    }
}

const SAVE_ERROR = 'Não foi possível salvar agora. Tente de novo em instantes.';

try {
    // ---------- públicas (página) ----------
    if ($action === 'clique' && $method === 'POST') {
        $id = setup_body()['id'] ?? '';
        if (!setup_is_id($id)) {
            setup_fail('Pedido inválido.');
        }
        $content = setup_public_content();
        $ids = array_merge(array_column($content['buttons'], 'id'), array_column($content['socials'], 'id'));
        if (!in_array($id, $ids, true)) {
            setup_fail('Não encontrado.', 404);
        }
        setup_click_add($id);
        http_response_code(204);
        exit;
    }
    if ($action === 'visita' && $method === 'POST') {
        $b = setup_body();
        $v = $b['v'] ?? '';
        if (!is_string($v) || !preg_match('/^[a-z0-9]{16,40}$/', $v)) {
            setup_fail('Pedido inválido.');
        }
        setup_visit_add($v, ($b['s'] ?? false) === true);
        http_response_code(204);
        exit;
    }

    // ---------- sessão ----------
    if ($action === 'sessao') {
        $user = setup_require_admin(false);
        setup_ok(['user' => $user, 'csrf' => setup_csrf()]);
    }
    if ($action === 'login' && $method === 'POST') {
        if (!setup_same_origin()) {
            setup_fail(SETUP_LOGIN_ERROR);
        }
        $r = setup_login(trim(setup_text($_POST, 'username')), setup_text($_POST, 'password'));
        if (isset($r['error'])) {
            setup_fail($r['error'], $r['status'] === 429 ? 429 : 400);
        }
        setup_ok(['csrf' => $r['csrf']]);
    }
    if ($action === 'sair' && $method === 'POST') {
        setup_logout();
        setup_ok();
    }

    // ---------- leitura do painel ----------
    if ($action === 'dados') {
        setup_require_admin(false);
        $visits = null;
        try {
            $visits = setup_visits();
        } catch (Throwable) {
            $visits = null;
        }
        setup_ok([
            'buttons' => setup_buttons(),
            'socials' => setup_socials(),
            'page' => setup_page(),
            'clicks' => (object) setup_clicks(),
            'visits' => $visits,
        ]);
    }

    if ($method !== 'POST') {
        setup_fail('Pedido inválido.', 405);
    }
    setup_require_admin(true);

    // ---------- botões ----------
    if ($action === 'botao-salvar') {
        [$data, $err] = setup_button_input($_POST);
        if ($err) {
            setup_fail('Confira os campos marcados.', 422, $err);
        }
        $id = setup_text($_POST, 'id');
        $list = setup_buttons();
        $i = -1;
        if ($id !== '') {
            foreach ($list as $k => $b) {
                if ($b['id'] === $id) {
                    $i = $k;
                }
            }
            if ($i < 0) {
                setup_fail('Esse botão não existe mais. Volte para a lista.', 404);
            }
        }
        $current = $i >= 0 ? $list[$i] : null;
        $icon = setup_resolve_icon($_POST, $current['icon'] ?? null);
        if (isset($icon['error'])) {
            setup_fail('Confira os campos marcados.', 422, ['icon' => $icon['error']]);
        }
        // Destaque com imagem: ícone da biblioteca não serve como imagem.
        if ($data['style'] === 'featured' && $icon['icon']['type'] === 'lib') {
            $icon['icon'] = ['type' => 'none'];
        }
        $position = $data['position'];
        unset($data['position']);
        $now = setup_now_iso();
        $item = $current
            ? array_merge($current, $data, ['icon' => $icon['icon'], 'updatedAt' => $now])
            : array_merge(['id' => setup_new_id('botao')], $data, ['icon' => $icon['icon'], 'createdAt' => $now, 'updatedAt' => $now]);
        try {
            if ($i >= 0) {
                array_splice($list, $i, 1);
            }
            array_splice($list, min(max($position, 1), count($list) + 1) - 1, 0, [$item]);
            setup_save_buttons($list);
            setup_cleanup_icon($current['icon'] ?? null, $item['icon']);
        } catch (Throwable) {
            setup_media_delete($icon['uploaded'] ?? null);
            setup_fail(SAVE_ERROR, 500);
        }
        setup_ok();
    }

    if (in_array($action, ['botao-mostrar', 'botao-mover', 'botao-duplicar', 'botao-excluir'], true)) {
        $body = setup_body();
        $id = setup_id_from($body);
        $list = setup_buttons();
        $i = array_search($id, array_column($list, 'id'), true);
        if ($i === false) {
            setup_ok(); // já não existe: nada a fazer
        }
        if ($action === 'botao-mostrar') {
            $list[$i]['visible'] = !$list[$i]['visible'];
            $list[$i]['updatedAt'] = setup_now_iso();
        } elseif ($action === 'botao-mover') {
            $j = ($body['dir'] ?? '') === 'up' ? $i - 1 : $i + 1;
            if ($j < 0 || $j >= count($list)) {
                setup_ok();
            }
            [$list[$i], $list[$j]] = [$list[$j], $list[$i]];
        } elseif ($action === 'botao-duplicar') {
            $orig = $list[$i];
            $icon = $orig['icon'];
            // A cópia de uma imagem própria ganha um arquivo próprio, para apagar um não afetar o outro.
            if ($icon['type'] === 'custom') {
                $m = setup_media_get($icon['mediaId']);
                $icon = $m ? ['type' => 'custom', 'mediaId' => setup_media_save($m['type'], $m['data'])] : ['type' => 'none'];
            }
            $suffix = ' (cópia)';
            $now = setup_now_iso();
            $copy = array_merge($orig, [
                'id' => setup_new_id('botao'),
                'icon' => $icon,
                'label' => trim(mb_substr($orig['label'], 0, SETUP_LIMITS['label'] - mb_strlen($suffix)) . $suffix),
                'visible' => false, // a cópia começa oculta para não aparecer duplicada na página
                'createdAt' => $now,
                'updatedAt' => $now,
            ]);
            array_splice($list, $i + 1, 0, [$copy]);
        } else {
            $removed = $list[$i];
            array_splice($list, $i, 1);
            setup_save_buttons($list);
            setup_cleanup_icon($removed['icon'], null);
            setup_click_reset($id);
            setup_ok();
        }
        setup_save_buttons($list);
        setup_ok();
    }

    if ($action === 'botao-ordem') {
        $ids = setup_body()['ids'] ?? null;
        if (!is_array($ids) || count($ids) > 500) {
            setup_fail('Pedido inválido.');
        }
        $pos = [];
        foreach (array_values($ids) as $k => $id) {
            if (!setup_is_id($id)) {
                setup_fail('Pedido inválido.');
            }
            $pos[$id] = $k;
        }
        $list = setup_buttons();
        usort($list, fn ($a, $b) => ($pos[$a['id']] ?? 1e6) <=> ($pos[$b['id']] ?? 1e6));
        setup_save_buttons($list);
        setup_ok();
    }

    // ---------- redes ----------
    if ($action === 'rede-salvar') {
        [$data, $err] = setup_social_input($_POST);
        if ($err) {
            setup_fail('Confira os campos marcados.', 422, $err);
        }
        $id = setup_text($_POST, 'id');
        $list = setup_socials();
        $i = $id !== '' ? array_search($id, array_column($list, 'id'), true) : false;
        if ($id !== '' && $i === false) {
            setup_fail('Essa rede não existe mais. Volte para a lista.', 404);
        }
        $current = $i !== false ? $list[$i] : null;
        $icon = setup_resolve_icon($_POST, $current['icon'] ?? null);
        if (isset($icon['error'])) {
            setup_fail('Confira os campos marcados.', 422, ['icon' => $icon['error']]);
        }
        if ($icon['icon']['type'] === 'none') {
            setup_fail('Confira os campos marcados.', 422, ['icon' => 'A rede precisa de um ícone.']);
        }
        $item = ['id' => $current['id'] ?? setup_new_id('rede'), 'icon' => $icon['icon']] + $data;
        try {
            if ($i !== false) {
                $list[$i] = $item;
            } else {
                $list[] = $item;
            }
            setup_save_socials($list);
            setup_cleanup_icon($current['icon'] ?? null, $item['icon']);
        } catch (Throwable) {
            setup_media_delete($icon['uploaded'] ?? null);
            setup_fail(SAVE_ERROR, 500);
        }
        setup_ok();
    }

    if (in_array($action, ['rede-mostrar', 'rede-mover', 'rede-excluir'], true)) {
        $body = setup_body();
        $id = setup_id_from($body);
        $list = setup_socials();
        $i = array_search($id, array_column($list, 'id'), true);
        if ($i === false) {
            setup_ok();
        }
        if ($action === 'rede-mostrar') {
            $list[$i]['visible'] = !$list[$i]['visible'];
        } elseif ($action === 'rede-mover') {
            $j = ($body['dir'] ?? '') === 'up' ? $i - 1 : $i + 1;
            if ($j < 0 || $j >= count($list)) {
                setup_ok();
            }
            [$list[$i], $list[$j]] = [$list[$j], $list[$i]];
        } else {
            $removed = $list[$i];
            array_splice($list, $i, 1);
            setup_save_socials($list);
            setup_cleanup_icon($removed['icon'], null);
            setup_click_reset($id);
            setup_ok();
        }
        setup_save_socials($list);
        setup_ok();
    }

    // ---------- página ----------
    if ($action === 'pagina-salvar') {
        [$data, $err] = setup_page_input($_POST);
        if ($err) {
            setup_fail('Confira os campos marcados.', 422, $err);
        }
        setup_save_page(array_merge(setup_page(), $data));
        setup_ok();
    }
    if ($action === 'logo-salvar') {
        $up = setup_read_upload('logoFile');
        if ($up === null) {
            setup_fail('Escolha a imagem do logo.');
        }
        if (isset($up['error'])) {
            setup_fail($up['error']);
        }
        $page = setup_page();
        $id = setup_media_save($up['type'], $up['bytes']);
        try {
            setup_save_page(array_merge($page, ['logoMediaId' => $id]));
        } catch (Throwable) {
            setup_media_delete($id);
            setup_fail(SAVE_ERROR, 500);
        }
        setup_media_delete($page['logoMediaId']);
        setup_ok();
    }
    if ($action === 'logo-original') {
        $page = setup_page();
        if ($page['logoMediaId']) {
            setup_save_page(array_merge($page, ['logoMediaId' => null]));
            setup_media_delete($page['logoMediaId']);
        }
        setup_ok();
    }

    setup_fail('Ação desconhecida.', 404);
} catch (SetupUnavailable) {
    setup_fail('O banco de dados está indisponível agora. Tente de novo em instantes.', 503);
} catch (Throwable $e) {
    error_log('[setup] erro na API: ' . get_class($e));
    setup_fail('Algo deu errado. Tente de novo em instantes.', 500);
}
