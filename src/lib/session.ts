import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  getAdminPath,
  verifySessionToken,
} from "./session-token";

export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor() {
    super("Não autorizado");
  }
}

/**
 * Lê o cookie de sessão direto do cabeçalho do pedido.
 * (Usar cookies() aqui dispara um erro interno do Next 16 em modo dev
 * quando a página é redesenhada logo depois de uma server action.)
 */
async function readSessionCookie(): Promise<string | undefined> {
  const header = (await headers()).get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE) return rest.join("=");
  }
  return undefined;
}

export async function isAuthenticated(): Promise<boolean> {
  return verifySessionToken(await readSessionCookie());
}

/** Para server actions: sem sessão válida, lança 401 e não toca em dado nenhum. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAuthenticated())) throw new UnauthorizedError();
}

/** Para páginas do painel: sem sessão, manda para o login. Devolve o caminho secreto. */
export async function requireAdminPage(): Promise<string> {
  // Lê o endereço secreto na hora do acesso, nunca no build.
  await connection();
  const base = getAdminPath();
  if (!base) redirect("/");
  if (!(await isAuthenticated())) redirect(`${base}/login`);
  return base;
}

export async function startSession(username: string): Promise<void> {
  const base = getAdminPath();
  if (!base) throw new UnauthorizedError();
  const token = await createSessionToken(username);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: base, // o cookie só é enviado para o caminho secreto do painel
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession(): Promise<void> {
  const base = getAdminPath();
  (await cookies()).set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: base ?? "/",
    maxAge: 0,
  });
}
