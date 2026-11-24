<?php
/**
 * Regras de validação (as mesmas do painel do Ric e de src/lib/content-types.ts).
 * Tudo que chega do navegador passa por aqui antes de ir para o banco.
 */
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

const SETUP_LIMITS = [
    'label' => 60, 'subtitle' => 80, 'badge' => 16, 'headline' => 140, 'highlight' => 60,
    'aboutTitle' => 60, 'aboutText' => 600, 'footer' => 80, 'socialLabel' => 40, 'groupTitle' => 24,
];
const SETUP_STYLES = ['white', 'orange', 'blue', 'lilac', 'purple', 'featured'];
const SETUP_ANIMATIONS = ['none', 'shine', 'pulse', 'both'];
const SETUP_ICON_NAMES = [
    'youtube', 'instagram', 'tiktok', 'twitch', 'kick', 'threads', 'x', 'discord', 'livepix', 'whatsapp',
    'email', 'telefone', 'facebook', 'linkedin', 'spotify', 'telegram', 'pinterest', 'formulario', 'site',
    'link', 'calendario', 'escola', 'endereco', 'coracao',
];
const SETUP_URL_ERROR = 'Link inválido. Use https://, wa.me/, mailto: ou tel:';

function setup_len(string $s): int
{
    return mb_strlen($s, 'UTF-8');
}

// ---------- links ----------

/** Aceita "wa.me/..." e "www..." sem https e completa o endereço. */
function setup_url_normalize(string $raw): string
{
    $v = trim($raw);
    if (preg_match('~^(www\.)?wa\.me/~i', $v) || preg_match('~^www\.~i', $v)) {
        return 'https://' . $v;
    }
    return $v;
}

/** Só https:// (inclui wa.me), mailto: e tel: são aceitos. */
function setup_url_allowed(string $url): bool
{
    if ($url === '' || strlen($url) > 2000 || preg_match('/[\x00-\x20\x7f]/', $url)) {
        return false;
    }
    if (preg_match('~^https://~i', $url)) {
        $p = parse_url($url);
        if (!$p || empty($p['host']) || isset($p['user']) || isset($p['pass'])) {
            return false;
        }
        return str_contains($p['host'], '.');
    }
    if (preg_match('~^mailto:(.+)$~i', $url, $m)) {
        $addr = rawurldecode(explode('?', $m[1], 2)[0]);
        return (bool) preg_match('/^[^@\s]+@[^@\s]+\.[^@\s]+$/', $addr);
    }
    if (preg_match('~^tel:(.+)$~i', $url, $m)) {
        return (bool) preg_match('/^\+?[0-9 ()-]{6,20}$/', rawurldecode($m[1]));
    }
    return false;
}

function setup_is_iso(mixed $v): bool
{
    return is_string($v) && preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?Z$/', $v) && strtotime($v) !== false;
}

function setup_hex(mixed $v): ?string
{
    return is_string($v) && preg_match('/^#[0-9a-f]{6}$/i', $v) ? strtolower($v) : null;
}

function setup_is_id(mixed $v): bool
{
    return is_string($v) && preg_match('/^[a-z0-9-]{1,64}$/', $v) === 1;
}

function setup_clean_icon(mixed $icon): ?array
{
    if (!is_array($icon) || !isset($icon['type'])) {
        return null;
    }
    return match ($icon['type']) {
        'none' => ['type' => 'none'],
        'lib' => in_array($icon['name'] ?? null, SETUP_ICON_NAMES, true) ? ['type' => 'lib', 'name' => $icon['name']] : null,
        'custom' => setup_is_id($icon['mediaId'] ?? null) ? ['type' => 'custom', 'mediaId' => $icon['mediaId']] : null,
        default => null,
    };
}

// ---------- dados guardados (conferência ao ler do banco) ----------

function setup_clean_button(mixed $b): ?array
{
    if (!is_array($b) || !setup_is_id($b['id'] ?? null)) {
        return null;
    }
    $label = is_string($b['label'] ?? null) ? $b['label'] : '';
    $url = is_string($b['url'] ?? null) ? $b['url'] : '';
    $icon = setup_clean_icon($b['icon'] ?? null);
    if ($label === '' || setup_len($label) > SETUP_LIMITS['label'] || ($url !== '' && !setup_url_allowed($url)) || !$icon) {
        return null;
    }
    $str = fn ($v, int $max) => is_string($v) && $v !== '' && setup_len($v) <= $max ? $v : null;
    $colors = is_array($b['colors'] ?? null) ? $b['colors'] : [];
    return [
        'id' => $b['id'],
        'label' => $label,
        'subtitle' => $str($b['subtitle'] ?? null, SETUP_LIMITS['subtitle']),
        'url' => $url,
        'icon' => $icon,
        'style' => in_array($b['style'] ?? null, SETUP_STYLES, true) ? $b['style'] : 'white',
        'colors' => ['bg' => setup_hex($colors['bg'] ?? null), 'text' => setup_hex($colors['text'] ?? null), 'icon' => setup_hex($colors['icon'] ?? null)],
        'gapBefore' => ($b['gapBefore'] ?? false) === true,
        'groupTitle' => $str($b['groupTitle'] ?? null, SETUP_LIMITS['groupTitle']),
        'half' => ($b['half'] ?? false) === true,
        'animation' => in_array($b['animation'] ?? null, SETUP_ANIMATIONS, true) ? $b['animation'] : 'none',
        'badge' => $str($b['badge'] ?? null, SETUP_LIMITS['badge']),
        'visible' => ($b['visible'] ?? true) === true,
        'startsAt' => setup_is_iso($b['startsAt'] ?? null) ? $b['startsAt'] : null,
        'endsAt' => setup_is_iso($b['endsAt'] ?? null) ? $b['endsAt'] : null,
        'createdAt' => setup_is_iso($b['createdAt'] ?? null) ? $b['createdAt'] : setup_now_iso(),
        'updatedAt' => setup_is_iso($b['updatedAt'] ?? null) ? $b['updatedAt'] : setup_now_iso(),
    ];
}

function setup_clean_social(mixed $s): ?array
{
    if (!is_array($s) || !setup_is_id($s['id'] ?? null)) {
        return null;
    }
    $icon = setup_clean_icon($s['icon'] ?? null);
    $label = is_string($s['label'] ?? null) ? $s['label'] : '';
    $url = is_string($s['url'] ?? null) ? $s['url'] : '';
    if (!$icon || $label === '' || setup_len($label) > SETUP_LIMITS['socialLabel'] || !setup_url_allowed($url)) {
        return null;
    }
    return ['id' => $s['id'], 'icon' => $icon, 'label' => $label, 'url' => $url, 'visible' => ($s['visible'] ?? true) === true];
}

function setup_clean_page(mixed $p): ?array
{
    if (!is_array($p)) {
        return null;
    }
    $out = ['logoMediaId' => setup_is_id($p['logoMediaId'] ?? null) ? $p['logoMediaId'] : null];
    foreach (['headline', 'highlight', 'aboutTitle', 'aboutText', 'footer'] as $k) {
        $v = is_string($p[$k] ?? null) ? $p[$k] : '';
        $out[$k] = setup_len($v) <= SETUP_LIMITS[$k] ? $v : '';
    }
    return $out;
}

// ---------- o que chega dos formulários ----------

function setup_text(array $src, string $key): string
{
    $v = $src[$key] ?? '';
    return is_string($v) ? $v : '';
}

/**
 * Formulário do botão. Devolve [dados, erros por campo].
 * As datas chegam em ISO (UTC); o navegador converte do horário de Brasília.
 */
function setup_button_input(array $p): array
{
    $err = [];
    $label = trim(setup_text($p, 'label'));
    if ($label === '') {
        $err['label'] = 'Escreva o texto do botão.';
    } elseif (setup_len($label) > SETUP_LIMITS['label']) {
        $err['label'] = 'O texto pode ter no máximo ' . SETUP_LIMITS['label'] . ' caracteres.';
    }
    $opt = function (string $key, int $max, string $name) use ($p, &$err): ?string {
        $v = trim(setup_text($p, $key));
        if (setup_len($v) > $max) {
            $err[$key] = "$name pode ter no máximo $max caracteres.";
        }
        return $v === '' ? null : $v;
    };
    $subtitle = $opt('subtitle', SETUP_LIMITS['subtitle'], 'O subtítulo');
    $badge = $opt('badge', SETUP_LIMITS['badge'], 'O selo');
    $groupTitle = $opt('groupTitle', SETUP_LIMITS['groupTitle'], 'O título do grupo');

    $url = trim(setup_text($p, 'url'));
    if (strlen($url) > 2000) {
        $err['url'] = 'Link muito longo.';
    } elseif ($url !== '') {
        $url = setup_url_normalize($url);
        if (!setup_url_allowed($url)) {
            $err['url'] = SETUP_URL_ERROR;
        }
    }

    $style = setup_text($p, 'style');
    if (!in_array($style, SETUP_STYLES, true)) {
        $err['style'] = 'Escolha um estilo.';
    }
    $animation = setup_text($p, 'animation');
    if (!in_array($animation, SETUP_ANIMATIONS, true)) {
        $err['animation'] = 'Escolha a animação.';
    }
    $colors = [];
    foreach (['bg' => 'colorBg', 'text' => 'colorText', 'icon' => 'colorIcon'] as $k => $field) {
        $raw = trim(setup_text($p, $field));
        $colors[$k] = $raw === '' ? null : setup_hex($raw);
        if ($raw !== '' && $colors[$k] === null) {
            $err[$field] = 'Cor inválida. Use #RRGGBB.';
        }
    }

    $dates = [];
    foreach (['startsAt' => 'início', 'endsAt' => 'fim'] as $k => $name) {
        $raw = trim(setup_text($p, $k));
        $dates[$k] = $raw === '' ? null : $raw;
        if ($raw !== '' && !setup_is_iso($raw)) {
            $err[$k] = "Data de $name inválida.";
        }
    }
    if (!isset($err['startsAt'], $err['endsAt']) && $dates['startsAt'] && $dates['endsAt'] && strtotime($dates['endsAt']) <= strtotime($dates['startsAt'])) {
        $err['endsAt'] = 'A data de fim precisa ser depois da data de início.';
    }

    $position = (int) setup_text($p, 'position');
    $data = [
        'label' => $label,
        'subtitle' => $subtitle,
        'url' => $url,
        'style' => $style,
        'colors' => $colors,
        'gapBefore' => setup_text($p, 'gapBefore') === 'on',
        'groupTitle' => $groupTitle,
        'half' => setup_text($p, 'half') === 'on',
        'animation' => $animation,
        'badge' => $badge,
        'visible' => setup_text($p, 'visible') === 'on',
        'startsAt' => $dates['startsAt'],
        'endsAt' => $dates['endsAt'],
        'position' => $position >= 1 && $position <= 1000 ? $position : 1000,
    ];
    return [$data, $err];
}

function setup_social_input(array $p): array
{
    $err = [];
    $label = trim(setup_text($p, 'label'));
    if ($label === '') {
        $err['label'] = 'Escreva o nome da rede (ex.: Instagram).';
    } elseif (setup_len($label) > SETUP_LIMITS['socialLabel']) {
        $err['label'] = 'O nome pode ter no máximo ' . SETUP_LIMITS['socialLabel'] . ' caracteres.';
    }
    $url = trim(setup_text($p, 'url'));
    if ($url === '') {
        $err['url'] = 'Coloque o link.';
    } elseif (strlen($url) > 2000) {
        $err['url'] = 'Link muito longo.';
    } else {
        $url = setup_url_normalize($url);
        if (!setup_url_allowed($url)) {
            $err['url'] = SETUP_URL_ERROR;
        }
    }
    return [['label' => $label, 'url' => $url, 'visible' => setup_text($p, 'visible') === 'on'], $err];
}

function setup_page_input(array $p): array
{
    $err = [];
    $names = [
        'headline' => 'O texto de cima', 'highlight' => 'O destaque', 'aboutTitle' => 'O título',
        'aboutText' => 'O texto', 'footer' => 'O rodapé',
    ];
    $data = [];
    foreach ($names as $k => $name) {
        $v = trim(str_replace("\r\n", "\n", setup_text($p, $k)));
        if (setup_len($v) > SETUP_LIMITS[$k]) {
            $err[$k] = "$name pode ter no máximo " . SETUP_LIMITS[$k] . ' caracteres.';
        }
        $data[$k] = $v;
    }
    if (!isset($err['highlight']) && $data['highlight'] !== '' && !str_contains($data['headline'], $data['highlight'])) {
        $err['highlight'] = 'O destaque precisa ser um trecho igualzinho ao do texto de cima.';
    }
    return [$data, $err];
}

// ---------- imagens enviadas ----------

function setup_looks_like_image(string $type, string $bytes): bool
{
    $head = substr($bytes, 0, 12);
    return match ($type) {
        'image/png' => str_starts_with($head, "\x89PNG\r\n\x1a\n"),
        'image/jpeg' => str_starts_with($head, "\xFF\xD8\xFF"),
        'image/webp' => substr($head, 0, 4) === 'RIFF' && substr($head, 8, 4) === 'WEBP',
        'image/svg+xml' => (bool) preg_match('/<svg[\s>]/i', substr($bytes, 0, 4096)),
        default => false,
    };
}

/**
 * Lê um arquivo de imagem enviado. Devolve null se não veio arquivo,
 * ['error' => ...] se for inválido, ou ['type' => ..., 'bytes' => ...].
 */
function setup_read_upload(string $field): ?array
{
    $f = $_FILES[$field] ?? null;
    if (!is_array($f) || ($f['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE || (int) ($f['size'] ?? 0) === 0) {
        return null;
    }
    if (($f['error'] ?? 0) === UPLOAD_ERR_INI_SIZE || ($f['error'] ?? 0) === UPLOAD_ERR_FORM_SIZE || (int) $f['size'] > SETUP_MEDIA_MAX) {
        return ['error' => 'A imagem pode ter no máximo 600 KB.'];
    }
    if (($f['error'] ?? 0) !== UPLOAD_ERR_OK || !is_uploaded_file((string) $f['tmp_name'])) {
        return ['error' => 'Não consegui receber a imagem. Tente de novo.'];
    }
    $bytes = (string) file_get_contents((string) $f['tmp_name']);
    // O tipo vem do conteúdo do arquivo, não do nome nem do que o navegador diz.
    $type = (new finfo(FILEINFO_MIME_TYPE))->buffer($bytes) ?: '';
    if ($type === 'image/svg' || ($type === 'text/xml' || $type === 'application/xml' || $type === 'text/plain') && preg_match('/<svg[\s>]/i', substr($bytes, 0, 4096))) {
        $type = 'image/svg+xml';
    }
    if (!in_array($type, SETUP_MEDIA_TYPES, true)) {
        return ['error' => 'Use uma imagem PNG, JPG, WEBP ou SVG.'];
    }
    if (!setup_looks_like_image($type, $bytes)) {
        return ['error' => 'Esse arquivo não parece ser uma imagem válida.'];
    }
    return ['type' => $type, 'bytes' => $bytes];
}

/**
 * Ícone escolhido no formulário: "none", "lib:<nome>", "custom-keep" (mantém a imagem atual)
 * ou "custom-new" (arquivo enviado em iconFile). Devolve ['icon' => ..., 'uploaded' => id?] ou ['error' => ...].
 */
function setup_resolve_icon(array $p, ?array $current): array
{
    $choice = setup_text($p, 'iconChoice');
    if ($choice === 'none') {
        return ['icon' => ['type' => 'none']];
    }
    if (str_starts_with($choice, 'lib:')) {
        $name = substr($choice, 4);
        return in_array($name, SETUP_ICON_NAMES, true) ? ['icon' => ['type' => 'lib', 'name' => $name]] : ['error' => 'Escolha um ícone da lista.'];
    }
    if ($choice === 'custom-keep') {
        return ($current['type'] ?? null) === 'custom' ? ['icon' => $current] : ['error' => 'Envie a imagem do ícone.'];
    }
    if ($choice === 'custom-new') {
        $up = setup_read_upload('iconFile');
        if ($up === null) {
            return ['error' => 'Envie a imagem do ícone.'];
        }
        if (isset($up['error'])) {
            return $up;
        }
        $id = setup_media_save($up['type'], $up['bytes']);
        return ['icon' => ['type' => 'custom', 'mediaId' => $id], 'uploaded' => $id];
    }
    return ['error' => 'Escolha um ícone.'];
}
