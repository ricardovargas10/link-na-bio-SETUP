import "server-only";
import { Redis } from "@upstash/redis";

import { getRedisRestToken, getRedisRestUrl } from "./redis-env";

// A integração da Upstash na Vercel pode criar os nomes KV_* ou UPSTASH_*, com ou sem prefixo.
const url = getRedisRestUrl();
const token = getRedisRestToken();

export const redis: Redis | null =
  url && token ? new Redis({ url, token, retry: { retries: 1 } }) : null;

/**
 * Sem Redis configurado, no ambiente de desenvolvimento os dados ficam na memória
 * (somem ao reiniciar). Em produção o Redis é obrigatório.
 * LOCAL_MEMORY_STORE=1 permite testar o build de produção no seu computador
 * (`npm run build && npm start`); essa opção é ignorada na Vercel.
 */
export const memoryFallback =
  !redis &&
  (process.env.NODE_ENV !== "production" ||
    (process.env.LOCAL_MEMORY_STORE === "1" && !process.env.VERCEL));

type MemoryStore = Map<string, unknown>;
const g = globalThis as unknown as { __setupMemoryStore?: MemoryStore };
export const memoryStore: MemoryStore = (g.__setupMemoryStore ??= new Map());

export function withTimeout<T>(promise: Promise<T>, ms = 2500): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Tempo esgotado ao acessar o banco")), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}
