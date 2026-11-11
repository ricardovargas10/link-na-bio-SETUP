/**
 * De onde vêm o usuário, o hash da senha e o segredo da sessão.
 * Sem "server-only" porque também é usado no proxy. Nunca registre estes valores em log.
 */
import { createHash } from "node:crypto";
import { adminPasswordHash, adminUsername } from "@/config/admin";
import { getRedisRestToken } from "./redis-env";

/** Usuário do painel: o do arquivo src/config/admin.ts; se vazio, a variável ADMIN_USERNAME. */
export function getAdminUsername(): string {
  return (adminUsername || process.env.ADMIN_USERNAME || "").trim();
}

/** Hash bcrypt da senha: o do arquivo; se vazio, a variável ADMIN_PASSWORD_HASH. */
export function getAdminPasswordHash(): string {
  return (adminPasswordHash || process.env.ADMIN_PASSWORD_HASH || "").trim();
}

/**
 * Segredo que assina o cookie de sessão.
 * Usa SESSION_SECRET se existir (32+ caracteres). Senão, é derivado da chave
 * do Upstash Redis que a própria integração da Vercel cria — assim não precisa
 * cadastrar nada e o segredo nunca fica no código.
 */
export function getSessionSecret(): string | null {
  const explicit = process.env.SESSION_SECRET?.trim();
  if (explicit && explicit.length >= 32) return explicit;
  const redisToken = getRedisRestToken();
  if (redisToken) {
    return createHash("sha256").update(`setup-admin-session:v1:${redisToken}`).digest("base64url");
  }
  return null;
}

/** Para a mensagem do login: o que está faltando (sem revelar nenhum valor). */
export function missingConfig(): string | null {
  if (!getAdminUsername() || !getAdminPasswordHash()) return "falta definir usuário e senha";
  if (!getSessionSecret()) return "o site não está recebendo as chaves do banco Upstash";
  return null;
}
