// Monta a pasta deploy/ = o que vai para a public_html da Hostinger:
//   - out/ (painel estático e ícones gerados pelo Next)
//   - php/ (página pública, API, instalador e .htaccess)
//   - api/lib/build.php com o CSS e a fonte que a página em PHP precisa carregar.
import { cpSync, existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const out = new URL("out/", root);
const deploy = new URL("deploy/", root);

if (!existsSync(new URL("admin-setup/index.html", out))) {
  throw new Error("Rode o build do Next antes (npm run build).");
}

rmSync(deploy, { recursive: true, force: true });
cpSync(out, deploy, { recursive: true });
cpSync(new URL("php/", root), deploy, { recursive: true });

// Ícones gerados pelo Next saem sem extensão; o servidor precisa do .png.
for (const name of ["icon", "apple-icon", "opengraph-image"]) {
  const file = new URL(name, deploy);
  if (existsSync(file)) renameSync(file, new URL(`${name}.png`, deploy));
}

// O CSS, a fonte e a classe da fonte saem do HTML do painel (o mesmo build).
const html = readFileSync(new URL("admin-setup/index.html", out), "utf8");
const css = [...new Set([...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+\.css)"/g)].map((m) => m[1]))];
const fonts = [...new Set([...html.matchAll(/<link[^>]+href="([^"]+\.woff2)"[^>]*>/g)].map((m) => m[1]))];
const htmlClass = (html.match(/<html[^>]*class="([^"]*)"/) ?? [])[1] ?? "";
const fontVar = htmlClass.split(/\s+/).filter((c) => c && !["h-full", "antialiased"].includes(c)).join(" ");
if (!css.length) throw new Error("Não achei o CSS no HTML do painel.");

const php = (v) => `'${String(v).replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`;
writeFileSync(
  new URL("api/lib/build.php", deploy),
  `<?php\n// Gerado por scripts/montar-deploy.mjs. Não edite à mão.\nreturn [\n  'css' => [${css.map(php).join(", ")}],\n  'fonts' => [${fonts.map(php).join(", ")}],\n  'htmlClass' => ${php(fontVar)},\n];\n`,
);

// Configuração local de teste nunca vai junto.
rmSync(new URL("api/lib/config.local.php", deploy), { force: true });

console.log(`deploy/ pronto: css ${css.length}, fontes ${fonts.length}, classe "${fontVar}"`);
