import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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

export async function isAuthenticated(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

/** Para server actions: sem sessão válida, lança 401 e não toca em dado nenhum. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAuthenticated())) throw new UnauthorizedError();
}

/** Para páginas do painel: sem sessão, manda para o login. Devolve o caminho secreto. */
export async function requireAdminPage(): Promise<string> {
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
