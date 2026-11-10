import type { MetadataRoute } from "next";

// Sem sitemap e sem citar o painel: listar o caminho aqui revelaria o endereço.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" } };
}
