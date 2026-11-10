import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, getAdminPath, verifySessionToken } from "@/lib/session-token";

const PRIVATE_HEADERS: Record<string, string> = {
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Cache-Control": "no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
};

function withPrivateHeaders(res: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(PRIVATE_HEADERS)) res.headers.set(k, v);
  return res;
}

/** Responde com a página 404 normal do site. */
function notFound(req: NextRequest): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = "/__pagina-nao-encontrada";
  url.search = "";
  return withPrivateHeaders(NextResponse.rewrite(url));
}

function normalize(pathname: string): string {
  let p = pathname;
  try {
    p = decodeURIComponent(p);
  } catch {
    /* mantém como veio */
  }
  return p.replace(/\/{2,}/g, "/").toLowerCase();
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const norm = normalize(pathname);

  // A rota interna nunca pode ser acessada direto.
  if (norm === "/admin" || norm.startsWith("/admin/") || norm.startsWith("/admin.")) {
    return notFound(req);
  }

  const base = getAdminPath();
  if (!base || (pathname !== base && !pathname.startsWith(base + "/"))) {
    return NextResponse.next();
  }

  const sub = pathname.slice(base.length).replace(/\/+$/, "") || "/";
  const isLogin = sub === "/login";

  if (!isLogin) {
    const ok = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
    if (!ok) {
      // Qualquer escrita sem sessão: 401, sem dado nenhum.
      if (req.method !== "GET" && req.method !== "HEAD") {
        const res = new NextResponse("Não autorizado", { status: 401 });
        for (const [k, v] of Object.entries(PRIVATE_HEADERS)) res.headers.set(k, v);
        return res;
      }
      const login = req.nextUrl.clone();
      login.pathname = `${base}/login`;
      login.search = "";
      return withPrivateHeaders(NextResponse.redirect(login));
    }
  }

  const target = req.nextUrl.clone();
  target.pathname = sub === "/" ? "/admin" : `/admin${sub}`;
  return withPrivateHeaders(NextResponse.rewrite(target));
}

export const config = {
  // Roda em todas as rotas, menos a página inicial e os arquivos estáticos.
  matcher: [
    "/((?!_next/static|_next/image|brand/|icon|apple-icon|opengraph-image|robots\\.txt|favicon\\.ico).+)",
  ],
};
