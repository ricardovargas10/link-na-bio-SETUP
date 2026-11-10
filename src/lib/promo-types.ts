import { z } from "zod";

export const PROMO_COLORS = ["orange", "blue", "lilac", "purple"] as const;
export type PromoColor = (typeof PROMO_COLORS)[number];

export const COLOR_LABELS: Record<PromoColor, string> = {
  orange: "Laranja",
  blue: "Azul",
  lilac: "Lilás",
  purple: "Roxo",
};

export const LIMITS = { title: 60, subtitle: 80, badge: 16, url: 2000 } as const;

/** Aceita "wa.me/..." sem https e completa o endereço. */
export function normalizeUrl(raw: string): string {
  const v = raw.trim();
  if (/^(www\.)?wa\.me\//i.test(v)) return `https://${v}`;
  return v;
}

/** Só https:// (inclui wa.me) e mailto: são aceitos. */
export function isAllowedUrl(value: string): boolean {
  let u: URL;
  try {
    u = new URL(value);
  } catch {
    return false;
  }
  if (u.protocol === "https:") return u.hostname.includes(".") && !u.username && !u.password;
  if (u.protocol === "mailto:") {
    let address = u.pathname;
    try {
      address = decodeURIComponent(address);
    } catch {
      return false;
    }
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address);
  }
  return false;
}

const isoDate = z.string().refine((v) => !Number.isNaN(Date.parse(v)));

/** Formato guardado no banco. */
export const promoSchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().min(1).max(LIMITS.title),
  subtitle: z.string().max(LIMITS.subtitle).nullable(),
  badge: z.string().max(LIMITS.badge).nullable(),
  url: z.string().max(LIMITS.url).refine(isAllowedUrl),
  color: z.enum(PROMO_COLORS),
  active: z.boolean(),
  startsAt: isoDate.nullable(),
  endsAt: isoDate.nullable(),
  order: z.number().int(),
  createdAt: isoDate,
  updatedAt: isoDate,
});

export type Promo = z.infer<typeof promoSchema>;

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, { error: `${label} pode ter no máximo ${max} caracteres.` })
    .transform((v) => (v === "" ? null : v));

/** O que chega do formulário do painel (datas já convertidas para ISO). */
export const promoInputSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, { error: "Escreva um título." })
      .max(LIMITS.title, { error: `O título pode ter no máximo ${LIMITS.title} caracteres.` }),
    subtitle: optionalText(LIMITS.subtitle, "O subtítulo"),
    badge: optionalText(LIMITS.badge, "O selo"),
    url: z
      .string()
      .trim()
      .min(1, { error: "Coloque o link." })
      .max(LIMITS.url, { error: "Link muito longo." })
      .transform(normalizeUrl)
      .refine(isAllowedUrl, {
        error: "Link inválido. Use um endereço que comece com https://, wa.me/ ou mailto:",
      }),
    color: z.enum(PROMO_COLORS, { error: "Escolha uma cor." }),
    active: z.boolean(),
    startsAt: isoDate.nullable(),
    endsAt: isoDate.nullable(),
    position: z.number().int().min(1).max(1000),
  })
  .refine((v) => !v.startsAt || !v.endsAt || Date.parse(v.endsAt) > Date.parse(v.startsAt), {
    error: "A data de fim precisa ser depois da data de início.",
    path: ["endsAt"],
  });

export type PromoInput = z.infer<typeof promoInputSchema>;

export type PromoStatus = "ativa" | "agendada" | "expirada" | "desligada";

export function promoStatus(
  p: Pick<Promo, "active" | "startsAt" | "endsAt">,
  now: number,
): PromoStatus {
  if (!p.active) return "desligada";
  if (p.endsAt && Date.parse(p.endsAt) <= now) return "expirada";
  if (p.startsAt && Date.parse(p.startsAt) > now) return "agendada";
  return "ativa";
}

export function sortPromos<T extends Pick<Promo, "order" | "createdAt">>(list: T[]): T[] {
  return [...list].sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
}
