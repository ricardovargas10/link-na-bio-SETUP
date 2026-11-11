import "server-only";
import { randomBytes } from "node:crypto";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { memoryFallback, memoryStore, redis, withTimeout } from "./redis";
import {
  DEFAULT_PAGE,
  DEFAULT_SOCIALS,
  buttonSchema,
  buttonStatus,
  defaultButtons,
  pageSchema,
  socialSchema,
  type LinkButtonData,
  type PageData,
  type PublicContentShape,
  type SocialData,
} from "./content-types";

export const CONTENT_TAG = "conteudo";

const KEYS = {
  buttons: "setup:buttons",
  socials: "setup:socials",
  page: "setup:page",
  clicks: "setup:clicks",
  oldSettings: "setup:settings", // versão anterior: só o link do formulário
  media: (id: string) => `setup:media:${id}`,
};

export class StoreUnavailableError extends Error {
  constructor() {
    super("Banco de dados não configurado");
  }
}

// ---------- acesso bruto ----------

async function getRaw(key: string): Promise<unknown> {
  if (redis) return withTimeout(redis.get<unknown>(key));
  if (memoryFallback) return memoryStore.get(key) ?? null;
  throw new StoreUnavailableError();
}

async function setRaw(key: string, value: string): Promise<void> {
  if (redis) {
    await withTimeout(redis.set(key, value), 8000);
    return;
  }
  if (memoryFallback) {
    memoryStore.set(key, value);
    return;
  }
  throw new StoreUnavailableError();
}

async function delRaw(key: string): Promise<void> {
  if (redis) {
    await withTimeout(redis.del(key));
    return;
  }
  if (memoryFallback) {
    memoryStore.delete(key);
    return;
  }
  throw new StoreUnavailableError();
}

function asJson(raw: unknown): unknown {
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function parseList<T>(raw: unknown, schema: z.ZodType<T>): T[] | null {
  const data = asJson(raw);
  if (data == null) return null;
  if (!Array.isArray(data)) return [];
  return data.flatMap((item) => {
    const r = schema.safeParse(item);
    return r.success ? [r.data] : [];
  });
}

export function newId(prefix: string): string {
  return `${prefix}-${randomBytes(6).toString("hex")}`;
}

// ---------- botões ----------

export async function readButtons(): Promise<LinkButtonData[]> {
  const list = parseList(await getRaw(KEYS.buttons), buttonSchema);
  if (list) return list;
  // Primeira vez: monta os botões padrão (usa o link do formulário salvo na versão anterior, se houver).
  const old = asJson(await getRaw(KEYS.oldSettings)) as { formUrl?: unknown } | null;
  const formUrl = typeof old?.formUrl === "string" ? old.formUrl : undefined;
  return defaultButtons(formUrl);
}

export async function writeButtons(list: LinkButtonData[]): Promise<void> {
  await setRaw(KEYS.buttons, JSON.stringify(z.array(buttonSchema).parse(list)));
}

// ---------- redes ----------

export async function readSocials(): Promise<SocialData[]> {
  return parseList(await getRaw(KEYS.socials), socialSchema) ?? DEFAULT_SOCIALS;
}

export async function writeSocials(list: SocialData[]): Promise<void> {
  await setRaw(KEYS.socials, JSON.stringify(z.array(socialSchema).parse(list)));
}

// ---------- página ----------

export async function readPage(): Promise<PageData> {
  const data = asJson(await getRaw(KEYS.page));
  const r = pageSchema.partial().safeParse(data ?? {});
  return { ...DEFAULT_PAGE, ...(r.success ? r.data : {}) };
}

export async function writePage(page: PageData): Promise<void> {
  await setRaw(KEYS.page, JSON.stringify(pageSchema.parse(page)));
}

// ---------- imagens (logo e ícones próprios) ----------

export const MEDIA_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"] as const;
export const MEDIA_MAX_BYTES = 600 * 1024;

export async function saveMedia(type: string, bytes: Buffer): Promise<string> {
  const id = newId("img");
  await setRaw(KEYS.media(id), JSON.stringify({ type, data: bytes.toString("base64") }));
  return id;
}

export async function readMedia(id: string): Promise<{ type: string; bytes: Buffer } | null> {
  const data = asJson(await getRaw(KEYS.media(id))) as { type?: unknown; data?: unknown } | null;
  if (!data || typeof data.type !== "string" || typeof data.data !== "string") return null;
  if (!(MEDIA_TYPES as readonly string[]).includes(data.type)) return null;
  return { type: data.type, bytes: Buffer.from(data.data, "base64") };
}

export async function deleteMedia(id: string | null | undefined): Promise<void> {
  if (!id) return;
  try {
    await delRaw(KEYS.media(id));
  } catch {
    /* não é crítico */
  }
}

// ---------- cliques ----------

const g = globalThis as unknown as { __setupClicks?: Map<string, number> };
const memoryClicks: Map<string, number> = (g.__setupClicks ??= new Map());

export async function addClick(id: string): Promise<void> {
  if (redis) {
    await withTimeout(redis.hincrby(KEYS.clicks, id, 1));
    return;
  }
  if (memoryFallback) memoryClicks.set(id, (memoryClicks.get(id) ?? 0) + 1);
}

export async function readClicks(): Promise<Record<string, number>> {
  try {
    if (redis) {
      const all = (await withTimeout(redis.hgetall<Record<string, number | string>>(KEYS.clicks))) ?? {};
      return Object.fromEntries(Object.entries(all).map(([k, v]) => [k, Number(v) || 0]));
    }
    if (memoryFallback) return Object.fromEntries(memoryClicks);
  } catch {
    /* sem contador, segue a vida */
  }
  return {};
}

export async function resetClicks(id: string): Promise<void> {
  if (redis) {
    await withTimeout(redis.hdel(KEYS.clicks, id));
    return;
  }
  memoryClicks.delete(id);
}

// ---------- página pública ----------

export type PublicContent = PublicContentShape;

/**
 * Tudo que a página pública mostra. Fica em cache e é refeito a cada 60 s
 * (para respeitar o agendamento) ou na hora em que o painel salva algo.
 * Se o banco estiver fora do ar, mostra o conteúdo padrão.
 */
export async function getPublicContent(): Promise<PublicContent> {
  "use cache";
  cacheTag(CONTENT_TAG);
  // stale de 5 min deixa o conteúdo já pronto no HTML (sem versão provisória);
  // revalidate de 60 s respeita o agendamento; salvar no painel atualiza na hora.
  cacheLife({ stale: 300, revalidate: 60, expire: 3600 });
  const now = Date.now();
  let page = DEFAULT_PAGE;
  let buttons = defaultButtons();
  let socials = DEFAULT_SOCIALS;
  try {
    [page, buttons, socials] = await Promise.all([readPage(), readButtons(), readSocials()]);
  } catch {
    console.error("[conteudo] banco indisponível; mostrando o conteúdo padrão");
  }
  return {
    page,
    buttons: buttons.filter((b) => buttonStatus(b, now) === "no-ar"),
    socials: socials.filter((s) => s.visible),
  };
}

/** Ids que podem receber clique (botões e redes visíveis). */
export async function getClickableIds(): Promise<Set<string>> {
  const { buttons, socials } = await getPublicContent();
  return new Set([...buttons.map((b) => b.id), ...socials.map((s) => s.id)]);
}
