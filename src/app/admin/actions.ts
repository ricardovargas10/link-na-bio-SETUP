"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { checkCredentials } from "@/lib/auth";
import { consumeLoginAttempt, resetLoginAttempts } from "@/lib/ratelimit";
import { endSession, requireAdmin, startSession } from "@/lib/session";
import { getAdminPath, isSessionConfigured } from "@/lib/session-token";
import { missingConfig } from "@/lib/admin-credentials";
import { PROMOS_TAG, readPromos, writePromos } from "@/lib/promos";
import { LIMITS, isAllowedUrl, normalizeUrl, promoInputSchema, type Promo } from "@/lib/promo-types";
import { writeSettings, readSettings } from "@/lib/settings";
import { spLocalToIso } from "@/lib/time";

const GENERIC_LOGIN_ERROR = "Usuário ou senha incorretos";

export type LoginState = { error?: string };
export type SaveState = { error?: string; fieldErrors?: Record<string, string> };
export type SettingsState = { error?: string; ok?: boolean; savedAt?: number };

async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip")?.trim() || "desconhecido";
}

function text(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

function adminBase(): string {
  const base = getAdminPath();
  if (!base) throw new Error("Painel desativado");
  return base;
}

/** Atualiza a página pública na hora, sem novo deploy. */
function refreshPublicPage() {
  updateTag(PROMOS_TAG);
  revalidatePath("/");
}

// ---------- Login ----------

export async function loginAction(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const base = getAdminPath();
  if (!base || !isSessionConfigured()) {
    const missing = missingConfig();
    return { error: `Painel indisponível no momento${missing ? ` (${missing})` : ""}.` };
  }

  const ip = await clientIp();
  const limit = await consumeLoginAttempt(ip);
  if (!limit.ok) {
    return limit.reason === "blocked"
      ? { error: `Muitas tentativas. Tente de novo em ${limit.minutes} min.` }
      : { error: "Painel indisponível no momento. Tente mais tarde." };
  }

  const parsed = z
    .object({ username: z.string().trim().min(1).max(100), password: z.string().min(1).max(200) })
    .safeParse({ username: fd.get("username"), password: fd.get("password") });
  if (!parsed.success) return { error: GENERIC_LOGIN_ERROR };

  const ok = await checkCredentials(parsed.data.username, parsed.data.password);
  if (!ok) return { error: GENERIC_LOGIN_ERROR };

  await resetLoginAttempts(ip);
  await startSession(parsed.data.username);
  redirect(base);
}

export async function logoutAction(): Promise<void> {
  const base = adminBase();
  await endSession();
  redirect(`${base}/login`);
}

// ---------- Promoções ----------

const idSchema = z.string().min(1).max(64);

/** Toda escrita passa por aqui: confere a sessão antes de ler ou gravar qualquer coisa. */
async function mutate(change: (list: Promo[]) => Promo[] | null): Promise<void> {
  await requireAdmin();
  const list = await readPromos();
  const next = change(list);
  if (!next) return;
  await writePromos(next);
  refreshPublicPage();
}

export async function togglePromoAction(id: string): Promise<void> {
  await requireAdmin();
  const pid = idSchema.parse(id);
  await mutate((list) => {
    const p = list.find((x) => x.id === pid);
    if (!p) return null;
    p.active = !p.active;
    p.updatedAt = new Date().toISOString();
    return list;
  });
}

export async function movePromoAction(id: string, direction: "up" | "down"): Promise<void> {
  await requireAdmin();
  const pid = idSchema.parse(id);
  const dir = z.enum(["up", "down"]).parse(direction);
  await mutate((list) => {
    const i = list.findIndex((x) => x.id === pid);
    const j = dir === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= list.length) return null;
    [list[i], list[j]] = [list[j], list[i]];
    return list;
  });
}

export async function duplicatePromoAction(id: string): Promise<void> {
  await requireAdmin();
  const pid = idSchema.parse(id);
  await mutate((list) => {
    const i = list.findIndex((x) => x.id === pid);
    if (i < 0) return null;
    const now = new Date().toISOString();
    const original = list[i];
    const suffix = " (cópia)";
    const copy: Promo = {
      ...original,
      id: crypto.randomUUID(),
      title: (original.title.slice(0, LIMITS.title - suffix.length) + suffix).trim(),
      active: false, // a cópia começa desligada para não aparecer duplicada na página
      createdAt: now,
      updatedAt: now,
    };
    list.splice(i + 1, 0, copy);
    return list;
  });
}

export async function deletePromoAction(id: string): Promise<void> {
  await requireAdmin();
  const pid = idSchema.parse(id);
  await mutate((list) => {
    const next = list.filter((x) => x.id !== pid);
    return next.length === list.length ? null : next;
  });
}

export async function savePromoAction(_prev: SaveState, fd: FormData): Promise<SaveState> {
  await requireAdmin();
  const base = adminBase();

  const fieldErrors: Record<string, string> = {};
  const startsAt = spLocalToIso(text(fd, "startsAt"));
  const endsAt = spLocalToIso(text(fd, "endsAt"));
  if (startsAt === undefined) fieldErrors.startsAt = "Data de início inválida.";
  if (endsAt === undefined) fieldErrors.endsAt = "Data de fim inválida.";

  const parsed = promoInputSchema.safeParse({
    title: text(fd, "title"),
    subtitle: text(fd, "subtitle"),
    badge: text(fd, "badge"),
    url: text(fd, "url"),
    color: text(fd, "color"),
    active: fd.get("active") === "on",
    startsAt: startsAt ?? null,
    endsAt: endsAt ?? null,
    position: Number.parseInt(text(fd, "position"), 10) || 1000,
  });

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
  }
  if (!parsed.success || Object.keys(fieldErrors).length > 0) {
    return { error: "Confira os campos marcados.", fieldErrors };
  }

  const { position, ...fields } = parsed.data;
  const id = text(fd, "id");

  try {
    const list = await readPromos();
    const now = new Date().toISOString();
    let item: Promo;
    if (id) {
      const i = list.findIndex((x) => x.id === id);
      if (i < 0) return { error: "Essa promoção não existe mais. Volte para a lista." };
      item = { ...list[i], ...fields, updatedAt: now };
      list.splice(i, 1);
    } else {
      item = { id: crypto.randomUUID(), ...fields, order: 0, createdAt: now, updatedAt: now };
    }
    const at = Math.min(Math.max(position, 1), list.length + 1) - 1;
    list.splice(at, 0, item);
    await writePromos(list);
  } catch {
    console.error("[painel] falha ao salvar promoção");
    return { error: "Não foi possível salvar agora. Tente de novo em instantes." };
  }

  refreshPublicPage();
  redirect(base);
}

// ---------- Link do formulário ----------

export async function saveFormUrlAction(_prev: SettingsState, fd: FormData): Promise<SettingsState> {
  await requireAdmin();
  const raw = text(fd, "formUrl").trim();
  const url = normalizeUrl(raw);
  if (!raw) return { error: "Coloque o link do formulário." };
  if (url.length > LIMITS.url || !isAllowedUrl(url)) {
    return { error: "Link inválido. Use um endereço que comece com https://" };
  }
  try {
    const current = await readSettings();
    await writeSettings({ ...current, formUrl: url });
  } catch {
    console.error("[painel] falha ao salvar o link do formulário");
    return { error: "Não foi possível salvar agora. Tente de novo em instantes." };
  }
  refreshPublicPage();
  return { ok: true, savedAt: Date.now() };
}
