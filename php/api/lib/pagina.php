<?php
/**
 * HTML da página pública, no visual da Set Up.
 *
 * IMPORTANTE: os botões aqui são o mesmo HTML do componente src/components/LinkCard.tsx
 * (que o painel usa na pré-visualização). Mudou lá, mude aqui também.
 */
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

const SETUP_BTN_STYLES = [
    'white' => ['body' => 'border-raisin/10 bg-white text-raisin group-hover:border-sunset group-active:border-sunset', 'icon' => 'text-sunset', 'sub' => 'text-raisin/70', 'ring' => 'border-sunset', 'shine' => 'promo-shine-warm'],
    'orange' => ['body' => 'border-sunset bg-sunset text-white', 'icon' => 'text-white', 'sub' => 'text-white/85', 'ring' => 'border-sunset', 'shine' => ''],
    'blue' => ['body' => 'border-sky bg-sky text-raisin', 'icon' => 'text-raisin', 'sub' => 'text-raisin/75', 'ring' => 'border-sky', 'shine' => ''],
    'lilac' => ['body' => 'border-lilac bg-lilac text-raisin', 'icon' => 'text-raisin', 'sub' => 'text-raisin/75', 'ring' => 'border-lilac', 'shine' => ''],
    'purple' => ['body' => 'border-raisin bg-raisin text-shell', 'icon' => 'text-sunset', 'sub' => 'text-shell/80', 'ring' => 'border-raisin', 'shine' => ''],
    'featured' => ['body' => 'border-raisin/10 bg-white text-raisin group-hover:border-sunset group-active:border-sunset', 'icon' => 'text-sunset', 'sub' => 'text-raisin/70', 'ring' => 'border-sunset', 'shine' => 'promo-shine-warm'],
];

/** Desenho (SVG) dos ícones da biblioteca, gerado no build a partir do Tabler (scripts/icones.mjs). */
function setup_icon_svgs(): array
{
    static $svgs = null;
    if ($svgs === null) {
        $file = __DIR__ . '/icones.php';
        $svgs = is_file($file) ? (require $file) : [];
    }
    return $svgs;
}

/** Ícone de um botão: da biblioteca, imagem enviada, ou nada. */
function setup_icon_html(array $icon, string $class): string
{
    if ($icon['type'] === 'lib') {
        $svg = setup_icon_svgs()[$icon['name']] ?? '';
        return str_replace('%CLASS%', e($class), $svg);
    }
    if ($icon['type'] === 'custom') {
        return '<img src="/media/' . e($icon['mediaId']) . '" alt="" aria-hidden="true" class="' . e($class) . ' rounded-[6px] object-contain" loading="lazy" decoding="async">';
    }
    return '';
}

function setup_style_attr(array $props): string
{
    $parts = [];
    foreach ($props as $k => $v) {
        if ($v !== null && $v !== '') {
            $parts[] = $k . ':' . $v;
        }
    }
    return $parts ? ' style="' . e(implode(';', $parts)) . '"' : '';
}

/** Links externos abrem em nova aba; mailto abre o app de e-mail na mesma aba. */
function setup_link_attrs(string $url): string
{
    return str_starts_with($url, 'mailto:') ? '' : ' target="_blank" rel="noopener noreferrer"';
}

function setup_badge_html(?string $badge): string
{
    if (!$badge) {
        return '';
    }
    return '<span class="absolute -top-3 right-5 z-10 rotate-2 rounded-full border-2 border-raisin bg-shell px-3 py-0.5 text-[11px] leading-5 font-bold tracking-wide text-raisin uppercase sm:text-[12px]">' . e($badge) . '</span>';
}

function setup_button_html(array $b): string
{
    $s = SETUP_BTN_STYLES[$b['style']] ?? SETUP_BTN_STYLES['white'];
    $c = $b['colors'];
    $shine = in_array($b['animation'], ['shine', 'both'], true);
    $pulse = in_array($b['animation'], ['pulse', 'both'], true);
    $hasIcon = $b['icon']['type'] !== 'none';
    $iconStyle = setup_style_attr(['color' => $c['icon']]);
    $bodyStyle = setup_style_attr(['background-color' => $c['bg'], 'border-color' => $c['bg'], 'color' => $c['text']]);
    $label = e($b['label']);
    $badge = setup_badge_html($b['badge']);
    $subClass = $c['text'] ? 'opacity-75' : $s['sub'];

    // Sem link: aviso, não parece clicável.
    if ($b['url'] === '' && $b['style'] !== 'featured') {
        $icon = $hasIcon ? '<span class="flex shrink-0 ' . ($c['icon'] ? '' : 'text-sunset') . '"' . $iconStyle . '>' . setup_icon_html($b['icon'], 'size-[18px]') . '</span>' : '';
        return '<div class="relative flex min-h-[50px] items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-raisin/25 px-4 py-2.5 text-center text-raisin sm:min-h-14 sm:rounded-[22px]"' . setup_style_attr(['color' => $c['text']]) . '>'
            . $icon . '<span class="text-[14.5px] leading-snug font-semibold">' . $label . '</span>' . $badge . '</div>';
    }

    $ring = $pulse ? '<span aria-hidden="true" class="promo-ring ' . $s['ring'] . '"' . setup_style_attr(['border-color' => $c['bg']]) . '></span>' : '';
    $shineEl = $shine ? '<span aria-hidden="true" class="promo-shine ' . $s['shine'] . '"></span>' : '';
    $sub = $b['subtitle'] ? '<span class="mt-0.5 text-[13px] leading-snug break-words sm:text-[14px] ' . $subClass . '">' . e($b['subtitle']) . '</span>' : '';

    if ($b['style'] === 'featured') {
        // Destaque com imagem: imagem 16:9 em cima e o texto embaixo (sem imagem, só o texto).
        $thumb = $b['icon']['type'] === 'custom'
            ? '<img src="/media/' . e($b['icon']['mediaId']) . '" alt="" class="block aspect-video w-full object-cover" loading="lazy" decoding="async">'
            : '';
        $inner = $ring . '<span class="promo-body overflow-hidden rounded-[22px] border-2 ' . $s['body'] . '"' . $bodyStyle . '>' . $shineEl . $thumb
            . '<span class="flex w-full flex-col px-4 pt-3 pb-3.5 text-center"><span class="text-[16px] leading-snug font-semibold tracking-[-0.01em] break-words">' . $label . '</span>' . $sub . '</span></span>' . $badge;
    } elseif ($b['half']) {
        $icon = $hasIcon ? '<span class="flex shrink-0 ' . ($c['icon'] ? '' : $s['icon']) . '"' . $iconStyle . '>' . setup_icon_html($b['icon'], 'size-[18px]') . '</span>' : '';
        $inner = $ring . '<span class="promo-body min-h-[50px] rounded-[18px] border-2 px-3 py-2 sm:min-h-14 sm:rounded-[20px] ' . $s['body'] . '"' . $bodyStyle . '>' . $shineEl
            . '<span class="flex max-w-full min-w-0 items-center justify-center gap-2">' . $icon . '<span class="min-w-0 truncate text-[14.5px] leading-snug font-semibold">' . $label . '</span></span></span>' . $badge;
    } else {
        $icon = $hasIcon ? '<span class="absolute top-1/2 left-4 flex -translate-y-1/2 sm:left-5 ' . ($c['icon'] ? '' : $s['icon']) . '"' . $iconStyle . '>' . setup_icon_html($b['icon'], 'size-5 sm:size-6') . '</span>' : '';
        $pad = $hasIcon ? 'px-12 sm:px-14' : 'px-5 sm:px-6';
        $inner = $ring . '<span class="promo-body min-h-[50px] rounded-[20px] border-2 py-2.5 text-center sm:min-h-14 sm:rounded-[22px] sm:py-3 ' . $pad . ' ' . $s['body'] . '"' . $bodyStyle . '>' . $shineEl . $icon
            . '<span class="text-[15px] leading-snug font-semibold tracking-[-0.01em] break-words sm:text-[16px]">' . $label . '</span>' . $sub . '</span>' . $badge;
    }

    if ($b['url'] === '') {
        return '<div class="promo group">' . $inner . '</div>';
    }
    return '<a href="' . e($b['url']) . '"' . setup_link_attrs($b['url']) . ' data-track="' . e($b['id']) . '" class="promo group">' . $inner . '</a>';
}

/** Botões em grupos (com título opcional) e meia largura lado a lado. */
function setup_buttons_html(array $buttons): string
{
    $groups = [];
    foreach ($buttons as $b) {
        if (!$groups || $b['gapBefore']) {
            $groups[] = ['title' => $b['gapBefore'] ? $b['groupTitle'] : null, 'items' => [$b]];
        } else {
            $groups[count($groups) - 1]['items'][] = $b;
        }
    }
    $html = '';
    foreach ($groups as $gi => $g) {
        $rows = [];
        foreach ($g['items'] as $b) {
            $last = count($rows) - 1;
            if ($b['half'] && $last >= 0 && count($rows[$last]) === 1 && $rows[$last][0]['half']) {
                $rows[$last][] = $b;
            } else {
                $rows[] = [$b];
            }
        }
        $html .= '<nav aria-label="' . e($g['title'] ?: 'Links') . '" class="text-left' . ($gi === 0 ? '' : ' mt-6') . '">';
        if ($g['title']) {
            $html .= '<p class="mb-2.5 text-center text-[12px] font-bold tracking-[0.08em] text-raisin/60 uppercase">' . e($g['title']) . '</p>';
        }
        $html .= '<div class="flex flex-col gap-3">';
        foreach ($rows as $r) {
            $html .= count($r) === 2
                ? '<div class="grid grid-cols-2 gap-3">' . setup_button_html($r[0]) . setup_button_html($r[1]) . '</div>'
                : setup_button_html($r[0]);
        }
        $html .= '</div></nav>';
    }
    return $html;
}

/** Linha de ícones das redes, embaixo dos botões. */
function setup_socials_html(array $socials): string
{
    if (!$socials) {
        return '';
    }
    $html = '<nav aria-label="Redes sociais"><ul class="flex flex-wrap items-center justify-center gap-1.5">';
    foreach ($socials as $s) {
        $html .= '<li><a href="' . e($s['url']) . '"' . setup_link_attrs($s['url']) . ' data-track="' . e($s['id']) . '" aria-label="' . e($s['label']) . '" title="' . e($s['label']) . '" class="flex size-11 items-center justify-center rounded-full text-raisin transition-[transform,color] duration-150 hover:-translate-y-0.5 hover:text-sunset">'
            . setup_icon_html($s['icon'], 'size-[26px]') . '</a></li>';
    }
    return $html . '</ul></nav>';
}

/** Texto de cima com o trecho em destaque na caixa azul inclinada (igual ao Highlight.tsx). */
function setup_headline_html(string $headline, string $highlight): string
{
    $h = trim($highlight);
    $i = $h !== '' ? mb_strpos($headline, $h) : false;
    if ($i === false) {
        return e($headline);
    }
    $before = mb_substr($headline, 0, $i);
    $after = mb_substr($headline, $i + mb_strlen($h));
    return e($before)
        . '<span class="relative inline-block whitespace-nowrap px-1.5"><span aria-hidden="true" class="absolute inset-x-0 inset-y-[0.06em] -rotate-[1.5deg] rounded-[6px] bg-sky"></span><span class="relative">' . e($h) . '</span></span>'
        . e($after);
}
