import "server-only";
import { z } from "zod";
import { memoryFallback, memoryStore, redis, withTimeout } from "./redis";
import { promoSchema, promoStatus, sortPromos, type Promo } from "./promo-types";

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
