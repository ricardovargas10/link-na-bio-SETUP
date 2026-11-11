import { addClick, getClickableIds } from "@/lib/content";

/** Recebe o aviso de clique de um botão ou rede e soma 1 no contador. */
export async function POST(request: Request) {
  let id = "";
  try {
    const body = (await request.json()) as { id?: unknown };
    id = typeof body.id === "string" ? body.id : "";
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!/^[a-z0-9-]{1,64}$/.test(id)) return new Response(null, { status: 400 });
  try {
    if (!(await getClickableIds()).has(id)) return new Response(null, { status: 404 });
    await addClick(id);
  } catch {
    /* contador indisponível: não atrapalha a página */
  }
  return new Response(null, { status: 204 });
}
