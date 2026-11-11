import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { memoryFallback, memoryStore, redis, withTimeout } from "./redis";
import { PROMOS_TAG, StoreUnavailableError } from "./promos";
import { isAllowedUrl } from "./promo-types";

/** Configurações editáveis pelo painel. Ficam numa chave única no Redis. */
export const SETTINGS_KEY = "setup:settings";

/** Link usado enquanto o painel não tiver um link salvo. */
export const DEFAULT_FORM_URL = "https://www.google.com";

const settingsSchema = z.object({
  formUrl: z.string().max(2000).refine(isAllowedUrl),
});

export type Settings = z.infer<typeof settingsSchema>;

const DEFAULTS: Settings = { formUrl: DEFAULT_FORM_URL };

function parse(raw: unknown): Settings {
  let data = raw;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return DEFAULTS;
    }
  }
  const r = settingsSchema.partial().safeParse(data ?? {});
  return r.success ? { ...DEFAULTS, ...r.data } : DEFAULTS;
}

/** Lê as configurações. Lança erro se o banco estiver fora do ar. */
export async function readSettings(): Promise<Settings> {
  if (redis) return parse(await withTimeout(redis.get<unknown>(SETTINGS_KEY)));
  if (memoryFallback) return parse(memoryStore.get(SETTINGS_KEY));
  throw new StoreUnavailableError();
}

export async function writeSettings(settings: Settings): Promise<void> {
  const value = JSON.stringify(settingsSchema.parse(settings));
  if (redis) {
    await withTimeout(redis.set(SETTINGS_KEY, value), 5000);
    return;
  }
  if (memoryFallback) {
    memoryStore.set(SETTINGS_KEY, value);
    return;
  }
  throw new StoreUnavailableError();
}

/** Para a página pública: em cache, atualiza junto com as promoções; nunca quebra a página. */
export async function getPublicSettings(): Promise<Settings> {
  "use cache";
  cacheTag(PROMOS_TAG);
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });
  try {
    return await readSettings();
  } catch {
    return DEFAULTS;
  }
}
