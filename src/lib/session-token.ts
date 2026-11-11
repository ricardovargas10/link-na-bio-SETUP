/**
 * Funções de sessão sem dependência de "next/headers", usadas também no proxy.
 * Nunca registre o token, o segredo ou o hash em log.
 */
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "setup_admin";
export const SESSION_MAX_AGE = 8 * 60 * 60; // 8 horas
const AUDIENCE = "setup-admin";

function secretKey(): Uint8Array | null {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) return null;
  return new TextEncoder().encode(s);
}

export function isSessionConfigured(): boolean {
  return secretKey() !== null && !!process.env.ADMIN_USERNAME;
}

export async function createSessionToken(username: string): Promise<string> {
  const key = secretKey();
  if (!key) throw new Error("SESSION_SECRET ausente ou curto");
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
  const username = process.env.ADMIN_USERNAME;
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

/**
 * Endereço do painel. Fixo no código, a pedido do cliente (não usa mais a
 * variável ADMIN_PATH). Para trocar, mude aqui: um trecho só, com letras,
 * números, "-" ou "_", e diferente de "/admin".
 */
export const ADMIN_PATH = "/admin-setup";

export function getAdminPath(): string | null {
  return ADMIN_PATH;
}
