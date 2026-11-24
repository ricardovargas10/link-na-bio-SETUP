<?php
/**
 * Página pública do link na bio (a que vai na bio do Instagram).
 * Monta o HTML no servidor com o conteúdo salvo no painel: carrega rápido e nada pisca.
 * O CSS e a fonte vêm do build do Next (api/lib/build.php, gerado por scripts/montar-deploy.mjs).
 */
declare(strict_types=1);

require_once __DIR__ . '/api/lib/conteudo.php';
require_once __DIR__ . '/api/lib/pagina.php';

$build = is_file(__DIR__ . '/api/lib/build.php') ? (require __DIR__ . '/api/lib/build.php') : ['css' => [], 'fonts' => [], 'htmlClass' => ''];
$content = setup_public_content();
$page = $content['page'];
$host = preg_replace('/[^a-z0-9.:-]/i', '', (string) ($_SERVER['HTTP_HOST'] ?? ''));
$origin = (setup_is_https() ? 'https://' : 'http://') . $host;
$title = 'Set Up | Escola de inglês para brasileiros';
$description = 'O inglês começa aqui e leva você para onde você quiser.';
$footer = str_replace('{ano}', date('Y'), $page['footer']);

header('Content-Type: text/html; charset=utf-8');
// Sempre confere se mudou (o painel atualiza na hora), mas aproveita o cache quando não mudou.
header('Cache-Control: no-cache');
header("Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
?>
<!doctype html>
<html lang="pt-BR" class="<?= e($build['htmlClass']) ?> h-full antialiased">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= e($title) ?></title>
<meta name="description" content="<?= e($description) ?>">
<meta name="theme-color" content="#FCF6EC">
<link rel="icon" href="/icon.png" type="image/png" sizes="64x64">
<link rel="apple-touch-icon" href="/apple-icon.png">
<meta property="og:title" content="<?= e($title) ?>">
<meta property="og:description" content="<?= e($description) ?>">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:url" content="<?= e($origin) ?>/">
<meta property="og:image" content="<?= e($origin) ?>/opengraph-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<?php foreach ($build['fonts'] as $font): ?>
<link rel="preload" href="<?= e($font) ?>" as="font" type="font/woff2" crossorigin>
<?php endforeach; ?>
<?php foreach ($build['css'] as $css): ?>
<link rel="stylesheet" href="<?= e($css) ?>">
<?php endforeach; ?>
</head>
<body class="min-h-full font-sans">
<div aria-hidden="true" class="pointer-events-none fixed inset-0 -z-10 bg-shell">
  <img src="/brand/background-1080.webp" srcset="/brand/background-640.webp 640w, /brand/background-1080.webp 1080w" sizes="100vw" alt="" class="absolute inset-0 size-full object-cover" decoding="async">
</div>
<?php /* Blocos (logo, texto, botões, sobre e rodapé) com espaço fixo entre eles e o conjunto centralizado na altura da tela. */ ?>
<main class="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-stretch justify-center gap-[clamp(2.5rem,7dvh,4.5rem)] px-5 py-12 text-center sm:py-14">
  <h1 class="sr-only"><?= e($title) ?></h1>

  <div class="flex justify-center">
<?php if ($page['logoMediaId']): ?>
    <img src="/media/<?= e($page['logoMediaId']) ?>" alt="Set Up" class="h-auto max-h-24 w-[130px] object-contain sm:w-[190px]" fetchpriority="high">
<?php else: ?>
    <img src="/brand/logo.png" alt="Set Up" width="1200" height="279" class="h-auto w-[130px] sm:w-[190px]" fetchpriority="high">
<?php endif; ?>
  </div>

<?php if ($page['headline'] !== ''): ?>
  <p class="text-[22px] leading-[1.2] font-extrabold tracking-[-0.03em] text-balance sm:text-[30px]"><?= setup_headline_html($page['headline'], $page['highlight']) ?></p>
<?php endif; ?>

  <div class="flex flex-col gap-5">
    <?= setup_buttons_html($content['buttons']) ?>
    <?= setup_socials_html($content['socials']) ?>
  </div>

<?php if ($page['aboutTitle'] !== '' || $page['aboutText'] !== ''): ?>
  <section<?= $page['aboutTitle'] !== '' ? ' aria-labelledby="sobre"' : '' ?>>
<?php if ($page['aboutTitle'] !== ''): ?>
    <h2 id="sobre" class="text-[16px] font-extrabold tracking-[-0.02em] sm:text-[19px]"><?= e($page['aboutTitle']) ?></h2>
<?php endif; ?>
<?php if ($page['aboutText'] !== ''): ?>
    <p class="mx-auto mt-1.5 max-w-[400px] text-[13.5px] leading-relaxed whitespace-pre-line text-pretty text-raisin/85 sm:text-[15px]"><?= e($page['aboutText']) ?></p>
<?php endif; ?>
  </section>
<?php endif; ?>

  <footer class="text-center text-[12px] font-medium text-raisin/80 sm:text-[13px]">
<?php if ($footer !== ''): ?>
    <p><?= e($footer) ?></p>
<?php endif; ?>
  </footer>
</main>
<script src="/track.js" defer></script>
</body>
</html>
