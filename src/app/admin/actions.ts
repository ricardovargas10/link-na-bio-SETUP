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
import {
  CONTENT_TAG,
  MEDIA_MAX_BYTES,
  MEDIA_TYPES,
  deleteMedia,
  newId,
  readButtons,
  readMedia,
  readPage,
  readSocials,
  resetClicks,
  saveMedia,
  writeButtons,
  writePage,
  writeSocials,
} from "@/lib/content";
import {
  LIMITS,
  buttonInputSchema,
  pageInputSchema,
  socialInputSchema,
  type IconRef,
  type LinkButtonData,
  type SocialData,
} from "@/lib/content-types";
import { ICON_NAMES, type IconName } from "@/lib/icon-names";
import { spLocalToIso } from "@/lib/time";

const GENERIC_LOGIN_ERROR = "Usuário ou senha incorretos";

export type LoginState = { error?: string };
export type FormState = { error?: string; ok?: boolean; fieldErrors?: Record<string, string> };

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
  updateTag(CONTENT_TAG);
  revalidatePath("/");
}

function zodErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

const SAVE_ERROR = "Não foi possível salvar agora. Tente de novo em instantes.";

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

// ---------- Imagens enviadas ----------

function looksLikeImage(type: string, bytes: Buffer): boolean {
  const head = bytes.subarray(0, 12);
  if (type === "image/png") return head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (type === "image/jpeg") return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  if (type === "image/webp") return head.subarray(0, 4).toString() === "RIFF" && head.subarray(8, 12).toString() === "WEBP";
  if (type === "image/svg+xml") return /<svg[\s>]/i.test(bytes.subarray(0, 4096).toString("utf8"));
  return false;
}

/** Lê um arquivo de imagem do formulário. Devolve null se não veio arquivo. */
async function readUpload(fd: FormData, key: string): Promise<{ type: string; bytes: Buffer } | { error: string } | null> {
  const file = fd.get(key);
  if (!(file instanceof File) || file.size === 0) return null;
  if (!(MEDIA_TYPES as readonly string[]).includes(file.type)) {
    return { error: "Use uma imagem PNG, JPG, WEBP ou SVG." };
  }
  if (file.size > MEDIA_MAX_BYTES) return { error: "A imagem pode ter no máximo 600 KB." };
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!looksLikeImage(file.type, bytes)) return { error: "Esse arquivo não parece ser uma imagem válida." };
  return { type: file.type, bytes };
}

/**
 * Resolve o ícone escolhido no formulário:
 * "none", "lib:<nome>", "custom-keep" (mantém a imagem atual) ou "custom-new" (arquivo enviado).
 */
async function resolveIcon(
  fd: FormData,
  current: IconRef | null,
): Promise<{ icon: IconRef; uploaded?: string } | { error: string }> {
  const choice = text(fd, "iconChoice");
  if (choice === "none") return { icon: { type: "none" } };
  if (choice.startsWith("lib:")) {
    const name = choice.slice(4) as IconName;
    if (!(ICON_NAMES as readonly string[]).includes(name)) return { error: "Escolha um ícone da lista." };
    return { icon: { type: "lib", name } };
  }
  if (choice === "custom-keep") {
    if (current?.type === "custom") return { icon: current };
    return { error: "Envie a imagem do ícone." };
  }
  if (choice === "custom-new") {
    const up = await readUpload(fd, "iconFile");
    if (!up) return { error: "Envie a imagem do ícone." };
    if ("error" in up) return up;
    const mediaId = await saveMedia(up.type, up.bytes);
    return { icon: { type: "custom", mediaId }, uploaded: mediaId };
  }
  return { error: "Escolha um ícone." };
}

/** Apaga a imagem antiga quando o ícone mudou. */
async function cleanupIcon(before: IconRef | null | undefined, after: IconRef | null | undefined) {
  if (before?.type === "custom" && !(after?.type === "custom" && after.mediaId === before.mediaId)) {
    await deleteMedia(before.mediaId);
  }
}

// ---------- Botões ----------

const idSchema = z.string().regex(/^[a-z0-9-]{1,64}$/);
const dirSchema = z.enum(["up", "down"]);

function move<T extends { id: string }>(list: T[], id: string, dir: "up" | "down"): T[] | null {
  const i = list.findIndex((x) => x.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return null;
  [list[i], list[j]] = [list[j], list[i]];
  return list;
}

export async function saveButtonAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const base = adminBase();
  const id = text(fd, "id");

  const fieldErrors: Record<string, string> = {};
  const startsAt = spLocalToIso(text(fd, "startsAt"));
  const endsAt = spLocalToIso(text(fd, "endsAt"));
  if (startsAt === undefined) fieldErrors.startsAt = "Data de início inválida.";
  if (endsAt === undefined) fieldErrors.endsAt = "Data de fim inválida.";

  const parsed = buttonInputSchema.safeParse({
    label: text(fd, "label"),
    subtitle: text(fd, "subtitle"),
    url: text(fd, "url"),
    style: text(fd, "style"),
    animation: text(fd, "animation"),
    badge: text(fd, "badge"),
    visible: fd.get("visible") === "on",
    startsAt: startsAt ?? null,
    endsAt: endsAt ?? null,
    position: Number.parseInt(text(fd, "position"), 10) || 1000,
  });
  if (!parsed.success) Object.assign(fieldErrors, zodErrors(parsed.error.issues));
  if (!parsed.success || Object.keys(fieldErrors).length > 0) {
    return { error: "Confira os campos marcados.", fieldErrors };
  }

  let uploaded: string | undefined;
  try {
    const list = await readButtons();
    const i = id ? list.findIndex((x) => x.id === id) : -1;
    if (id && i < 0) return { error: "Esse botão não existe mais. Volte para a lista." };
    const current = i >= 0 ? list[i] : null;

    const icon = await resolveIcon(fd, current?.icon ?? null);
    if ("error" in icon) return { error: "Confira os campos marcados.", fieldErrors: { icon: icon.error } };
    uploaded = icon.uploaded;

    const { position, ...fields } = parsed.data;
    const now = new Date().toISOString();
    const item: LinkButtonData = current
      ? { ...current, ...fields, icon: icon.icon, updatedAt: now }
      : { id: newId("botao"), ...fields, icon: icon.icon, createdAt: now, updatedAt: now };
    if (i >= 0) list.splice(i, 1);
    list.splice(Math.min(Math.max(position, 1), list.length + 1) - 1, 0, item);
    await writeButtons(list);
    await cleanupIcon(current?.icon, item.icon);
  } catch {
    await deleteMedia(uploaded);
    console.error("[painel] falha ao salvar botão");
    return { error: SAVE_ERROR };
  }

  refreshPublicPage();
  redirect(base);
}

async function mutateButtons(change: (list: LinkButtonData[]) => LinkButtonData[] | null) {
  const list = await readButtons();
  const next = change(list);
  if (!next) return;
  await writeButtons(next);
  refreshPublicPage();
}

export async function toggleButtonAction(id: string): Promise<void> {
  await requireAdmin();
  const bid = idSchema.parse(id);
  await mutateButtons((list) => {
    const b = list.find((x) => x.id === bid);
    if (!b) return null;
    b.visible = !b.visible;
    b.updatedAt = new Date().toISOString();
    return list;
  });
}

export async function moveButtonAction(id: string, direction: "up" | "down"): Promise<void> {
  await requireAdmin();
  const bid = idSchema.parse(id);
  const dir = dirSchema.parse(direction);
  await mutateButtons((list) => move(list, bid, dir));
}

export async function duplicateButtonAction(id: string): Promise<void> {
  await requireAdmin();
  const bid = idSchema.parse(id);
  const list = await readButtons();
  const i = list.findIndex((x) => x.id === bid);
  if (i < 0) return;
  const original = list[i];
  // A cópia de uma imagem própria ganha um arquivo próprio, para apagar um não afetar o outro.
  let icon: IconRef = original.icon;
  if (icon.type === "custom") {
    const media = await readMedia(icon.mediaId);
    icon = media ? { type: "custom", mediaId: await saveMedia(media.type, media.bytes) } : { type: "none" };
  }
  const now = new Date().toISOString();
  const suffix = " (cópia)";
  list.splice(i + 1, 0, {
    ...original,
    id: newId("botao"),
    icon,
    label: (original.label.slice(0, LIMITS.label - suffix.length) + suffix).trim(),
    visible: false, // a cópia começa oculta para não aparecer duplicada na página
    createdAt: now,
    updatedAt: now,
  });
  await writeButtons(list);
  refreshPublicPage();
}

export async function deleteButtonAction(id: string): Promise<void> {
  await requireAdmin();
  const bid = idSchema.parse(id);
  const list = await readButtons();
  const removed = list.find((x) => x.id === bid);
  if (!removed) return;
  await writeButtons(list.filter((x) => x.id !== bid));
  await cleanupIcon(removed.icon, null);
  await resetClicks(bid).catch(() => {});
  refreshPublicPage();
}

// ---------- Redes (linha de ícones) ----------

export async function saveSocialAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const base = adminBase();
  const id = text(fd, "id");

  const parsed = socialInputSchema.safeParse({
    label: text(fd, "label"),
    url: text(fd, "url"),
    visible: fd.get("visible") === "on",
  });
  if (!parsed.success) return { error: "Confira os campos marcados.", fieldErrors: zodErrors(parsed.error.issues) };

  let uploaded: string | undefined;
  try {
    const list = await readSocials();
    const i = id ? list.findIndex((x) => x.id === id) : -1;
    if (id && i < 0) return { error: "Essa rede não existe mais. Volte para a lista." };
    const current = i >= 0 ? list[i] : null;

    const icon = await resolveIcon(fd, current?.icon ?? null);
    if ("error" in icon) return { error: "Confira os campos marcados.", fieldErrors: { icon: icon.error } };
    if (icon.icon.type === "none") return { error: "Confira os campos marcados.", fieldErrors: { icon: "A rede precisa de um ícone." } };
    uploaded = icon.uploaded;

    const item: SocialData = { id: current?.id ?? newId("rede"), ...parsed.data, icon: icon.icon };
    if (i >= 0) list[i] = item;
    else list.push(item);
    await writeSocials(list);
    await cleanupIcon(current?.icon, item.icon);
  } catch {
    await deleteMedia(uploaded);
    console.error("[painel] falha ao salvar rede");
    return { error: SAVE_ERROR };
  }

  refreshPublicPage();
  redirect(`${base}/redes`);
}

async function mutateSocials(change: (list: SocialData[]) => SocialData[] | null) {
  const list = await readSocials();
  const next = change(list);
  if (!next) return;
  await writeSocials(next);
  refreshPublicPage();
}

export async function toggleSocialAction(id: string): Promise<void> {
  await requireAdmin();
  const sid = idSchema.parse(id);
  await mutateSocials((list) => {
    const s = list.find((x) => x.id === sid);
    if (!s) return null;
    s.visible = !s.visible;
    return list;
  });
}

export async function moveSocialAction(id: string, direction: "up" | "down"): Promise<void> {
  await requireAdmin();
  const sid = idSchema.parse(id);
  const dir = dirSchema.parse(direction);
  await mutateSocials((list) => move(list, sid, dir));
}

export async function deleteSocialAction(id: string): Promise<void> {
  await requireAdmin();
  const sid = idSchema.parse(id);
  const list = await readSocials();
  const removed = list.find((x) => x.id === sid);
  if (!removed) return;
  await writeSocials(list.filter((x) => x.id !== sid));
  await cleanupIcon(removed.icon, null);
  await resetClicks(sid).catch(() => {});
  refreshPublicPage();
}

// ---------- Página (textos e logo) ----------

export async function savePageAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = pageInputSchema.safeParse({
    headline: text(fd, "headline"),
    highlight: text(fd, "highlight"),
    aboutTitle: text(fd, "aboutTitle"),
    aboutText: text(fd, "aboutText"),
    footer: text(fd, "footer"),
  });
  if (!parsed.success) return { error: "Confira os campos marcados.", fieldErrors: zodErrors(parsed.error.issues) };
  const data = parsed.data;
  if (data.highlight && !data.headline.includes(data.highlight)) {
    return {
      error: "Confira os campos marcados.",
      fieldErrors: { highlight: "O destaque precisa ser um trecho igualzinho ao do texto de cima." },
    };
  }
  try {
    const page = await readPage();
    await writePage({ ...page, ...data });
  } catch {
    console.error("[painel] falha ao salvar a página");
    return { error: SAVE_ERROR };
  }
  refreshPublicPage();
  return { ok: true };
}

export async function saveLogoAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const up = await readUpload(fd, "logoFile");
  if (!up) return { error: "Escolha a imagem do logo." };
  if ("error" in up) return { error: up.error };
  let mediaId: string | undefined;
  try {
    const page = await readPage();
    mediaId = await saveMedia(up.type, up.bytes);
    await writePage({ ...page, logoMediaId: mediaId });
    await deleteMedia(page.logoMediaId);
  } catch {
    await deleteMedia(mediaId);
    console.error("[painel] falha ao salvar o logo");
    return { error: SAVE_ERROR };
  }
  refreshPublicPage();
  return { ok: true };
}

export async function resetLogoAction(): Promise<void> {
  await requireAdmin();
  const page = await readPage();
  if (!page.logoMediaId) return;
  await writePage({ ...page, logoMediaId: null });
  await deleteMedia(page.logoMediaId);
  refreshPublicPage();
}
