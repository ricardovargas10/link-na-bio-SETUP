import "server-only";
import { z } from "zod";
import { cacheLife, cacheTag } from "next/cache";
import { memoryFallback, memoryStore, redis, withTimeout } from "./redis";
import { promoSchema, promoStatus, sortPromos, type Promo, type PromoStatus } from "./promo-types";

export const PROMOS_KEY = "setup:promos";
export const PROMOS_TAG = "promos";

export class StoreUnavailableError extends Error {
  constructor() {
    super("Banco de dados não configurado");
  }
}

function parseList(raw: unknown): Promo[] {
  if (raw == null) return [];
  let data = raw;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(data)) return [];
  // Itens com formato inválido são ignorados em vez de quebrar a página.
  return data.flatMap((item) => {
    const r = promoSchema.safeParse(item);
    return r.success ? [r.data] : [];
  });
}

/** Lê todas as promoções. Lança erro se o banco estiver fora do ar. */
export async function readPromos(): Promise<Promo[]> {
  if (redis) return sortPromos(parseList(await withTimeout(redis.get<unknown>(PROMOS_KEY))));
  if (memoryFallback) return sortPromos(parseList(memoryStore.get(PROMOS_KEY)));
  throw new StoreUnavailableError();
}

/** Para a página pública: nunca lança; se o banco falhar, devolve lista vazia. */
export async function readPromosSafe(): Promise<Promo[]> {
  try {
    return await readPromos();
  } catch {
    console.error("[promos] não foi possível ler as promoções; mostrando só os botões fixos");
    return [];
  }
}

/** Grava a lista inteira, já renumerando a ordem (0, 1, 2...). */
export async function writePromos(list: Promo[]): Promise<void> {
  const normalized = z.array(promoSchema).parse(list.map((p, i) => ({ ...p, order: i })));
  if (redis) {
    await withTimeout(redis.set(PROMOS_KEY, JSON.stringify(normalized)), 5000);
    return;
  }
  if (memoryFallback) {
    memoryStore.set(PROMOS_KEY, JSON.stringify(normalized));
    return;
  }
  throw new StoreUnavailableError();
}

export function visiblePromos(list: Promo[], now: number): Promo[] {
  return sortPromos(list).filter((p) => promoStatus(p, now) === "ativa");
}

/**
 * Promoções que aparecem na página pública agora. Fica em cache e é refeita
 * a cada 60 s (para respeitar o agendamento) ou na hora em que o painel salva.
 */
export async function getPublicPromos(): Promise<Promo[]> {
  "use cache";
  cacheTag(PROMOS_TAG);
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });
  return visiblePromos(await readPromosSafe(), Date.now());
}

/** Para o painel: todas as promoções com o status calculado agora. */
export async function readPromosWithStatus(): Promise<(Promo & { status: PromoStatus })[]> {
  const now = Date.now();
  return (await readPromos()).map((p) => ({ ...p, status: promoStatus(p, now) }));
}
