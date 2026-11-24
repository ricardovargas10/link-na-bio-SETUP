<?php
/**
 * Leitura e gravação do conteúdo: botões, redes, página, imagens, cliques e visitas.
 * O conteúdo fica como JSON (mesmo formato dos tipos em src/lib/content-types.ts).
 */
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/validar.php';

/** Conteúdo inicial (os botões e textos da Set Up). */
function setup_defaults(): array
{
    static $d = null;
    if ($d === null) {
        $d = json_decode((string) file_get_contents(__DIR__ . '/padrao.json'), true, 32, JSON_THROW_ON_ERROR);
    }
    return $d;
}

function setup_kv_get(string $k): mixed
{
    $st = setup_db()->prepare('SELECT v FROM setup_kv WHERE k = ?');
    $st->execute([$k]);
    $v = $st->fetchColumn();
    if ($v === false) {
        return null;
    }
    $data = json_decode((string) $v, true);
    return is_array($data) ? $data : null;
}

function setup_kv_set(string $k, array $value): void
{
    $json = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    $st = setup_db()->prepare('INSERT INTO setup_kv (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)');
    $st->execute([$k, $json]);
}

// ---------- botões ----------

/** @return list<array> */
function setup_buttons(): array
{
    $list = setup_kv_get('buttons');
    if ($list === null) {
        return setup_defaults()['buttons'];
    }
    // Itens com formato inválido são ignorados em vez de quebrar a página.
    return array_values(array_filter(array_map('setup_clean_button', $list)));
}

function setup_save_buttons(array $list): void
{
    setup_kv_set('buttons', array_values($list));
}

// ---------- redes ----------

function setup_socials(): array
{
    $list = setup_kv_get('socials');
    if ($list === null) {
        return setup_defaults()['socials'];
    }
    return array_values(array_filter(array_map('setup_clean_social', $list)));
}

function setup_save_socials(array $list): void
{
    setup_kv_set('socials', array_values($list));
}

// ---------- página ----------

function setup_page(): array
{
    $page = setup_defaults()['page'];
    $saved = setup_kv_get('page');
    if (is_array($saved)) {
        foreach ($page as $key => $_) {
            if (array_key_exists($key, $saved)) {
                $page[$key] = $saved[$key];
            }
        }
    }
    return setup_clean_page($page) ?? setup_defaults()['page'];
}

function setup_save_page(array $page): void
{
    setup_kv_set('page', $page);
}

// ---------- imagens ----------

function setup_media_save(string $type, string $bytes): string
{
    $id = setup_new_id('img');
    $st = setup_db()->prepare('INSERT INTO setup_media (id, type, data) VALUES (?, ?, ?)');
    $st->bindValue(1, $id);
    $st->bindValue(2, $type);
    $st->bindValue(3, $bytes, PDO::PARAM_LOB);
    $st->execute();
    return $id;
}

/** @return array{type:string, data:string}|null */
function setup_media_get(string $id): ?array
{
    $st = setup_db()->prepare('SELECT type, data FROM setup_media WHERE id = ?');
    $st->execute([$id]);
    $row = $st->fetch();
    if (!$row || !in_array($row['type'], SETUP_MEDIA_TYPES, true)) {
        return null;
    }
    return ['type' => (string) $row['type'], 'data' => (string) $row['data']];
}

function setup_media_delete(?string $id): void
{
    if (!$id) {
        return;
    }
    try {
        setup_db()->prepare('DELETE FROM setup_media WHERE id = ?')->execute([$id]);
    } catch (Throwable) {
        // não é crítico
    }
}

// ---------- cliques ----------

function setup_click_add(string $id): void
{
    setup_db()->prepare('INSERT INTO setup_clicks (id, n) VALUES (?, 1) ON DUPLICATE KEY UPDATE n = n + 1')->execute([$id]);
}

/** @return array<string,int> */
function setup_clicks(): array
{
    $out = [];
    foreach (setup_db()->query('SELECT id, n FROM setup_clicks') as $row) {
        $out[(string) $row['id']] = (int) $row['n'];
    }
    return $out;
}

function setup_click_reset(string $id): void
{
    setup_db()->prepare('DELETE FROM setup_clicks WHERE id = ?')->execute([$id]);
}

// ---------- visitas ----------

/** Soma uma visita. "visitor" é um código aleatório do navegador; guardamos só o hash dele. */
function setup_visit_add(string $visitor, bool $newSession): void
{
    $db = setup_db();
    $day = setup_today();
    $db->prepare('INSERT IGNORE INTO setup_visitors (visitor, day) VALUES (?, ?)')->execute([hash('sha256', $visitor), $day]);
    if ($newSession) {
        $db->prepare('INSERT INTO setup_visits (day, n) VALUES (?, 1) ON DUPLICATE KEY UPDATE n = n + 1')->execute([$day]);
    }
}

function setup_visits(): array
{
    $db = setup_db();
    $day = setup_today();
    $people = (int) $db->query('SELECT COUNT(DISTINCT visitor) FROM setup_visitors')->fetchColumn();
    $st = $db->prepare('SELECT COUNT(*) FROM setup_visitors WHERE day = ?');
    $st->execute([$day]);
    $peopleToday = (int) $st->fetchColumn();
    $visits = (int) $db->query('SELECT COALESCE(SUM(n), 0) FROM setup_visits')->fetchColumn();
    $st = $db->prepare('SELECT n FROM setup_visits WHERE day = ?');
    $st->execute([$day]);
    $visitsToday = (int) ($st->fetchColumn() ?: 0);
    return ['people' => $people, 'visits' => $visits, 'peopleToday' => $peopleToday, 'visitsToday' => $visitsToday];
}

// ---------- página pública ----------

function setup_button_live(array $b, int $now): bool
{
    if (!$b['visible']) {
        return false;
    }
    if ($b['endsAt'] && strtotime($b['endsAt']) <= $now) {
        return false;
    }
    if ($b['startsAt'] && strtotime($b['startsAt']) > $now) {
        return false;
    }
    return true;
}

/**
 * Tudo que a página pública mostra. Se o banco estiver fora do ar ou ainda não
 * instalado, mostra o conteúdo padrão (os botões da Set Up) em vez de quebrar.
 */
function setup_public_content(): array
{
    try {
        $page = setup_page();
        $buttons = setup_buttons();
        $socials = setup_socials();
    } catch (Throwable) {
        $d = setup_defaults();
        [$page, $buttons, $socials] = [$d['page'], $d['buttons'], $d['socials']];
    }
    $now = time();
    return [
        'page' => $page,
        'buttons' => array_values(array_filter($buttons, fn ($b) => setup_button_live($b, $now))),
        'socials' => array_values(array_filter($socials, fn ($s) => $s['visible'])),
    ];
}
