/**
 * Acha as chaves do Upstash Redis no ambiente, com ou sem prefixo.
 * A integração da Vercel cria KV_REST_API_URL/KV_REST_API_TOKEN ou
 * UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN, e deixa colocar um
 * prefixo (ex.: STORAGE_KV_REST_API_URL). Aceita todos esses formatos.
 * Sem "server-only" porque também é usado no proxy. Nunca registre os valores.
 */
function findEnv(suffixes: string[]): string | undefined {
  for (const suffix of suffixes) {
    const exact = process.env[suffix];
    if (exact) return exact.trim();
  }
  for (const [key, value] of Object.entries(process.env)) {
    if (!value || key.includes("READ_ONLY")) continue;
    if (suffixes.some((s) => key.endsWith(`_${s}`))) return value.trim();
  }
  return undefined;
}

export function getRedisRestUrl(): string | undefined {
  return findEnv(["KV_REST_API_URL", "UPSTASH_REDIS_REST_URL"]);
}

export function getRedisRestToken(): string | undefined {
  return findEnv(["KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN"]);
}
