import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { memoryFallback, redis } from "./redis";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

const limiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX_ATTEMPTS, "15 m"),
      prefix: "setup:login",
      analytics: false,
    })
  : null;

// Só para desenvolvimento local sem Redis.
const g = globalThis as unknown as { __setupLoginAttempts?: Map<string, number[]> };
const memory: Map<string, number[]> = (g.__setupLoginAttempts ??= new Map());

export type LimitResult =
  | { ok: true }
  | { ok: false; reason: "blocked"; minutes: number }
  | { ok: false; reason: "unavailable" };

/** Conta uma tentativa de login para este IP. 5 a cada 15 minutos. */
export async function consumeLoginAttempt(ip: string): Promise<LimitResult> {
  if (limiter) {
    try {
      const r = await limiter.limit(ip);
      if (r.success) return { ok: true };
      return { ok: false, reason: "blocked", minutes: Math.max(1, Math.ceil((r.reset - Date.now()) / 60000)) };
    } catch {
      // Banco fora do ar: por segurança, não deixa tentar.
      return { ok: false, reason: "unavailable" };
    }
  }
  if (!memoryFallback) return { ok: false, reason: "unavailable" };

  const now = Date.now();
  const recent = (memory.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_ATTEMPTS) {
    memory.set(ip, recent);
    return { ok: false, reason: "blocked", minutes: Math.max(1, Math.ceil((recent[0] + WINDOW_MS - now) / 60000)) };
  }
  recent.push(now);
  memory.set(ip, recent);
  return { ok: true };
}

/** Depois de um login certo, zera o contador do IP. */
export async function resetLoginAttempts(ip: string): Promise<void> {
  if (limiter) {
    try {
      await limiter.resetUsedTokens(ip);
    } catch {
      /* não é crítico */
    }
    return;
  }
  memory.delete(ip);
}
