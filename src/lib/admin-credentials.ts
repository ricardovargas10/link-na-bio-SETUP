/**
 * De onde vêm o usuário, o hash da senha e o segredo da sessão.
 * Sem "server-only" porque também é usado no proxy. Nunca registre estes valores em log.
 */
import { createHash } from "node:crypto";
import { adminPasswordHash, adminUsername } from "@/config/admin";

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
  const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (redisToken) {
    return createHash("sha256").update(`setup-admin-session:v1:${redisToken}`).digest("base64url");
  }
  return null;
}
