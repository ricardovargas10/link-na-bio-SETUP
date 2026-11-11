/**
 * Tipos e regras do conteúdo editável pelo painel (botões, redes, página).
 * Pode ser usado no navegador e no servidor (sem segredos aqui).
 */
import { z } from "zod";
import { ICON_NAMES } from "./icon-names";

// ---------- Links ----------

/** Aceita "wa.me/..." e "www..." sem https e completa o endereço. */
export function normalizeUrl(raw: string): string {
  const v = raw.trim();
  if (/^(www\.)?wa\.me\//i.test(v)) return `https://${v}`;
  if (/^www\./i.test(v)) return `https://${v}`;
  return v;
}

/** Só https:// (inclui wa.me), mailto: e tel: são aceitos. */
export function isAllowedUrl(value: string): boolean {
  let u: URL;
  try {
    u = new URL(value);
  } catch {
    return false;
  }
  if (u.protocol === "https:") return u.hostname.includes(".") && !u.username && !u.password;
  if (u.protocol === "mailto:") {
    try {
      return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(decodeURIComponent(u.pathname));
    } catch {
      return false;
    }
  }
  if (u.protocol === "tel:") return /^\+?[0-9 ()-]{6,20}$/.test(decodeURIComponent(u.pathname));
  return false;
}

const urlField = z
  .string()
  .trim()
  .min(1, { error: "Coloque o link." })
  .max(2000, { error: "Link muito longo." })
  .transform(normalizeUrl)
  .refine(isAllowedUrl, { error: "Link inválido. Use https://, wa.me/, mailto: ou tel:" });

const isoDate = z.string().refine((v) => !Number.isNaN(Date.parse(v)));
const idField = z.string().regex(/^[a-z0-9-]{1,64}$/);

// ---------- Ícones ----------

export const iconSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("none") }),
  z.object({ type: z.literal("lib"), name: z.enum(ICON_NAMES) }),
  z.object({ type: z.literal("custom"), mediaId: idField }),
]);
export type IconRef = z.infer<typeof iconSchema>;

// ---------- Botões ----------

export const BUTTON_STYLES = ["white", "orange", "blue", "lilac", "purple"] as const;
export type ButtonStyle = (typeof BUTTON_STYLES)[number];
export const STYLE_LABELS: Record<ButtonStyle, string> = {
  white: "Branco",
  orange: "Laranja",
  blue: "Azul",
  lilac: "Lilás",
  purple: "Roxo",
};

export const ANIMATIONS = ["none", "shine", "pulse", "both"] as const;
export type Animation = (typeof ANIMATIONS)[number];
export const ANIMATION_LABELS: Record<Animation, string> = {
  none: "Sem animação",
  shine: "Brilho",
  pulse: "Pulso",
  both: "Brilho + pulso",
};

export const LIMITS = { label: 60, subtitle: 80, badge: 16, headline: 140, highlight: 60, aboutTitle: 60, aboutText: 600, footer: 80, socialLabel: 40 } as const;

export const buttonSchema = z.object({
  id: idField,
  label: z.string().min(1).max(LIMITS.label),
  subtitle: z.string().max(LIMITS.subtitle).nullable(),
  url: z.string().max(2000).refine(isAllowedUrl),
  icon: iconSchema,
  style: z.enum(BUTTON_STYLES),
  animation: z.enum(ANIMATIONS),
  badge: z.string().max(LIMITS.badge).nullable(),
  visible: z.boolean(),
  startsAt: isoDate.nullable(),
  endsAt: isoDate.nullable(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type LinkButtonData = z.infer<typeof buttonSchema>;

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, { error: `${label} pode ter no máximo ${max} caracteres.` })
    .transform((v) => (v === "" ? null : v));

/** O que chega do formulário do botão (datas já em ISO, ícone já resolvido). */
export const buttonInputSchema = z
  .object({
    label: z
      .string()
      .trim()
      .min(1, { error: "Escreva o texto do botão." })
      .max(LIMITS.label, { error: `O texto pode ter no máximo ${LIMITS.label} caracteres.` }),
    subtitle: optionalText(LIMITS.subtitle, "O subtítulo"),
    url: urlField,
    style: z.enum(BUTTON_STYLES, { error: "Escolha um estilo." }),
    animation: z.enum(ANIMATIONS, { error: "Escolha a animação." }),
    badge: optionalText(LIMITS.badge, "O selo"),
    visible: z.boolean(),
    startsAt: isoDate.nullable(),
    endsAt: isoDate.nullable(),
    position: z.number().int().min(1).max(1000),
  })
  .refine((v) => !v.startsAt || !v.endsAt || Date.parse(v.endsAt) > Date.parse(v.startsAt), {
    error: "A data de fim precisa ser depois da data de início.",
    path: ["endsAt"],
  });

export type ButtonStatus = "no-ar" | "agendado" | "encerrado" | "oculto";

export function buttonStatus(b: Pick<LinkButtonData, "visible" | "startsAt" | "endsAt">, now: number): ButtonStatus {
  if (!b.visible) return "oculto";
  if (b.endsAt && Date.parse(b.endsAt) <= now) return "encerrado";
  if (b.startsAt && Date.parse(b.startsAt) > now) return "agendado";
  return "no-ar";
}

// ---------- Redes (linha de ícones) ----------

export const socialSchema = z.object({
  id: idField,
  icon: iconSchema,
  label: z.string().min(1).max(LIMITS.socialLabel),
  url: z.string().max(2000).refine(isAllowedUrl),
  visible: z.boolean(),
});
export type SocialData = z.infer<typeof socialSchema>;

export const socialInputSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, { error: "Escreva o nome da rede (ex.: Instagram)." })
    .max(LIMITS.socialLabel, { error: `O nome pode ter no máximo ${LIMITS.socialLabel} caracteres.` }),
  url: urlField,
  visible: z.boolean(),
});

// ---------- Página ----------

export const pageSchema = z.object({
  logoMediaId: idField.nullable(),
  headline: z.string().max(LIMITS.headline),
  highlight: z.string().max(LIMITS.highlight),
  aboutTitle: z.string().max(LIMITS.aboutTitle),
  aboutText: z.string().max(LIMITS.aboutText),
  footer: z.string().max(LIMITS.footer),
});
export type PageData = z.infer<typeof pageSchema>;

export const pageInputSchema = z.object({
  headline: z
    .string()
    .trim()
    .max(LIMITS.headline, { error: `O texto de cima pode ter no máximo ${LIMITS.headline} caracteres.` }),
  highlight: z
    .string()
    .trim()
    .max(LIMITS.highlight, { error: `O destaque pode ter no máximo ${LIMITS.highlight} caracteres.` }),
  aboutTitle: z
    .string()
    .trim()
    .max(LIMITS.aboutTitle, { error: `O título pode ter no máximo ${LIMITS.aboutTitle} caracteres.` }),
  aboutText: z
    .string()
    .trim()
    .max(LIMITS.aboutText, { error: `O texto pode ter no máximo ${LIMITS.aboutText} caracteres.` }),
  footer: z
    .string()
    .trim()
    .max(LIMITS.footer, { error: `O rodapé pode ter no máximo ${LIMITS.footer} caracteres.` }),
});

/** Divide o texto de cima em antes / destaque / depois (destaque na caixa azul). */
export function splitHeadline(headline: string, highlight: string): [string, string, string] {
  const h = highlight.trim();
  const i = h ? headline.indexOf(h) : -1;
  if (i < 0) return [headline, "", ""];
  return [headline.slice(0, i), h, headline.slice(i + h.length)];
}

/** Rodapé: {ano} vira o ano atual. */
export function renderFooter(footer: string, year: number): string {
  return footer.replaceAll("{ano}", String(year));
}

// ---------- Valores iniciais ----------

const WHATSAPP_MESSAGE = "Olá! Vim pelo Instagram e quero saber mais sobre as aulas da Set Up.";
const T0 = "2026-11-11T00:00:00.000Z";

export const DEFAULT_PAGE: PageData = {
  logoMediaId: null,
  headline: "O inglês começa aqui e leva você para onde você quiser",
  highlight: "onde você quiser",
  aboutTitle: "Sobre a Set Up",
  aboutText:
    "A Set Up é uma escola de inglês feita para brasileiros. A gente parte das dificuldades de quem fala português para você aprender o inglês que vai usar de verdade e ganhar confiança para falar.",
  footer: "@setup.english · {ano}",
};

const base = { subtitle: null, style: "white", animation: "none", badge: null, visible: true, startsAt: null, endsAt: null, createdAt: T0, updatedAt: T0 } as const;

export function defaultButtons(formUrl = "https://www.google.com"): LinkButtonData[] {
  return [
    { ...base, id: "padrao-formulario", label: "Preencha o formulário de interesse", url: formUrl, icon: { type: "lib", name: "formulario" } },
    {
      ...base,
      id: "padrao-whatsapp",
      label: "Chamar no WhatsApp",
      url: `https://wa.me/5511915467152?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`,
      icon: { type: "lib", name: "whatsapp" },
    },
    { ...base, id: "padrao-email", label: "Envie um e-mail", url: "mailto:atendimento@setupenglish.com.br", icon: { type: "lib", name: "email" } },
    { ...base, id: "padrao-instagram", label: "Siga no Instagram", url: "https://www.instagram.com/setup.english/", icon: { type: "lib", name: "instagram" } },
  ];
}

export const DEFAULT_SOCIALS: SocialData[] = [
  { id: "rede-instagram", icon: { type: "lib", name: "instagram" }, label: "Instagram", url: "https://www.instagram.com/setup.english/", visible: true },
];

/** O que a página pública recebe (mesmo formato no servidor e no navegador). */
export type PublicContentShape = {
  page: PageData;
  buttons: LinkButtonData[];
  socials: SocialData[];
};
