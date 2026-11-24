import type { NextConfig } from "next";

/**
 * O Next gera só arquivos estáticos (pasta out/): o painel em /admin-setup e os ícones.
 * Quem salva e lê os dados é a API em PHP (pasta php/), porque a hospedagem
 * da Hostinger (plano Premium) roda PHP e MySQL, não Node.js.
 * Os cabeçalhos de segurança ficam no php/.htaccess.
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default nextConfig;
