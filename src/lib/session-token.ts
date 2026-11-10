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
 * Caminho secreto do painel (ex.: "/painel-7f3k9q2x").
 * Precisa ser um único trecho com pelo menos 8 letras/números/hífens.
 * Se estiver ausente ou inválido, o painel fica desligado (tudo dá 404).
 */
export function getAdminPath(): string | null {
  const raw = process.env.ADMIN_PATH?.trim();
  if (!raw) return null;
  const path = "/" + raw.replace(/^\/+|\/+$/g, "");
  if (!/^\/[A-Za-z0-9_-]{8,64}$/.test(path)) return null;
  if (path.toLowerCase() === "/admin") return null;
  return path;
}
