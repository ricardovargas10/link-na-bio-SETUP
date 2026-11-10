import "server-only";
import { Redis } from "@upstash/redis";

// A integração da Upstash na Vercel pode criar qualquer um dos dois pares.
const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis: Redis | null =
  url && token ? new Redis({ url, token, retry: { retries: 1 } }) : null;

/**
 * Sem Redis configurado, no ambiente de desenvolvimento os dados ficam na memória
 * (somem ao reiniciar). Em produção o Redis é obrigatório.
 */
export const memoryFallback = !redis && process.env.NODE_ENV !== "production";

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
