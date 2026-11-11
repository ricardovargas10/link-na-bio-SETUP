/**
 * Funções de sessão sem dependência de "next/headers", usadas também no proxy.
 * Nunca registre o token, o segredo ou o hash em log.
 */
import { SignJWT, jwtVerify } from "jose";
import { getAdminUsername, getSessionSecret } from "./admin-credentials";

export const SESSION_COOKIE = "setup_admin";
export const SESSION_MAX_AGE = 8 * 60 * 60; // 8 horas
const AUDIENCE = "setup-admin";

function secretKey(): Uint8Array | null {
  const s = getSessionSecret();
  return s ? new TextEncoder().encode(s) : null;
}

export function isSessionConfigured(): boolean {
  return secretKey() !== null && !!getAdminUsername();
}

export async function createSessionToken(username: string): Promise<string> {
  const key = secretKey();
  if (!key) throw new Error("Segredo da sessão indisponível");
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(username)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key);
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  const key = secretKey();
  const username = getAdminUsername();
  if (!token || !key || !username) return false;
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
      audience: AUDIENCE,
    });
    return payload.sub === username;
  } catch {
    return false;
  }
}

export { ADMIN_PATH } from "./admin-path";
import { ADMIN_PATH } from "./admin-path";

export function getAdminPath(): string | null {
  return ADMIN_PATH;
}
