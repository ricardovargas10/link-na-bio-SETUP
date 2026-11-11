import { readMedia } from "@/lib/content";

/** Entrega as imagens enviadas pelo painel (logo e ícones próprios). */
export async function GET(_request: Request, ctx: RouteContext<"/media/[id]">) {
  const { id } = await ctx.params;
  if (!/^img-[a-f0-9]{12}$/.test(id)) return new Response("Não encontrado", { status: 404 });
  let media: Awaited<ReturnType<typeof readMedia>> = null;
  try {
    media = await readMedia(id);
  } catch {
    return new Response("Indisponível", { status: 503 });
  }
  if (!media) return new Response("Não encontrado", { status: 404 });
  return new Response(new Uint8Array(media.bytes), {
    headers: {
      "Content-Type": media.type,
      // Cada imagem tem um id novo, então pode ficar em cache por muito tempo.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      // SVG nunca executa script, mesmo aberto direto no navegador.
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
