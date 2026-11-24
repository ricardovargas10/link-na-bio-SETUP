// Gera php/api/lib/icones.php: o desenho (SVG) de cada ícone da biblioteca, para a página em PHP.
// Lê a lista em src/components/BrandIcon.tsx (ICON_COMPONENTS), então nunca fica diferente do painel.
import { readFileSync, writeFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as Tabler from "@tabler/icons-react";

const src = readFileSync(new URL("../src/components/BrandIcon.tsx", import.meta.url), "utf8");
const block = src.slice(src.indexOf("ICON_COMPONENTS"), src.indexOf("};", src.indexOf("ICON_COMPONENTS")));
const pairs = [...block.matchAll(/^\s*([a-z]+):\s*(Icon\w+),/gm)].map((m) => [m[1], m[2]]);

const names = readFileSync(new URL("../src/lib/icon-names.ts", import.meta.url), "utf8");
const expected = [...names.slice(0, names.indexOf("] as const")).matchAll(/"([a-z]+)"/g)].map((m) => m[1]);
const missing = expected.filter((n) => !pairs.some(([k]) => k === n));
if (missing.length) throw new Error(`Ícones sem desenho em BrandIcon.tsx: ${missing.join(", ")}`);

const lines = pairs.map(([name, component]) => {
  const Icon = Tabler[component];
  if (!Icon) throw new Error(`Ícone não encontrado no Tabler: ${component}`);
  const svg = renderToStaticMarkup(createElement(Icon, { className: "%CLASS%", stroke: 2, "aria-hidden": true }));
  return `    '${name}' => '${svg.replaceAll("\\", "\\\\").replaceAll("'", "\\'")}',`;
});

writeFileSync(
  new URL("../php/api/lib/icones.php", import.meta.url),
  `<?php\n// Gerado por scripts/icones.mjs a partir dos ícones Tabler (licença MIT). Não edite à mão.\nreturn [\n${lines.join("\n")}\n];\n`,
);
console.log(`icones.php: ${pairs.length} ícones`);
