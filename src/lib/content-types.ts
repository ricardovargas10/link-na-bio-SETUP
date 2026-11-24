/**
 * Tipos e regras do conteúdo editável pelo painel (botões, redes, página).
 * Usado no navegador. A validação de verdade acontece na API em PHP (php/api/lib/validar.php),
 * que segue estas mesmas regras e limites.
 */
import type { IconName } from "./icon-names";

// ---------- Ícones ----------

export type IconRef = { type: "none" } | { type: "lib"; name: IconName } | { type: "custom"; mediaId: string };

// ---------- Botões ----------

export const BUTTON_STYLES = ["white", "orange", "blue", "lilac", "purple", "featured"] as const;
export type ButtonStyle = (typeof BUTTON_STYLES)[number];
export const STYLE_LABELS: Record<ButtonStyle, string> = {
  white: "Branco",
  orange: "Laranja",
  blue: "Azul",
  lilac: "Lilás",
  purple: "Roxo",
  featured: "Destaque com imagem",
};

export const ANIMATIONS = ["none", "shine", "pulse", "both"] as const;
export type Animation = (typeof ANIMATIONS)[number];
export const ANIMATION_LABELS: Record<Animation, string> = {
  none: "Sem animação",
  shine: "Brilho",
  pulse: "Pulso",
  both: "Brilho + pulso",
};

export const LIMITS = {
  label: 60,
  subtitle: 80,
  badge: 16,
  headline: 140,
  highlight: 60,
  aboutTitle: 60,
  aboutText: 600,
  footer: 80,
  socialLabel: 40,
  groupTitle: 24,
} as const;

export type ButtonColors = { bg: string | null; text: string | null; icon: string | null };
export const NO_COLORS: ButtonColors = { bg: null, text: null, icon: null };

export type LinkButtonData = {
  id: string;
  label: string;
  subtitle: string | null;
  /** Vazio = botão sem link (aviso). */
  url: string;
  icon: IconRef;
  style: ButtonStyle;
  colors: ButtonColors;
  /** Começa um novo bloco: espaço maior acima deste botão. */
  gapBefore: boolean;
  /** Título do grupo que começa neste botão. Só é usado quando gapBefore = true. */
  groupTitle: string | null;
  /** Ocupa metade da largura e divide a linha com o próximo botão também em meia largura. */
  half: boolean;
  animation: Animation;
  badge: string | null;
  visible: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ButtonStatus = "no-ar" | "agendado" | "encerrado" | "oculto";

export function buttonStatus(b: Pick<LinkButtonData, "visible" | "startsAt" | "endsAt">, now: number): ButtonStatus {
  if (!b.visible) return "oculto";
  if (b.endsAt && Date.parse(b.endsAt) <= now) return "encerrado";
  if (b.startsAt && Date.parse(b.startsAt) > now) return "agendado";
  return "no-ar";
}

// ---------- Redes (linha de ícones) ----------

export type SocialData = { id: string; icon: IconRef; label: string; url: string; visible: boolean };

// ---------- Página ----------

export type PageData = {
  logoMediaId: string | null;
  headline: string;
  highlight: string;
  aboutTitle: string;
  aboutText: string;
  footer: string;
};

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

/** Quebra a lista em grupos só onde "Começa um grupo aqui" está ligado, mantendo a ordem do painel. */
export function groupButtons<T extends Pick<LinkButtonData, "gapBefore" | "groupTitle">>(
  list: T[],
): { title: string | null; items: T[] }[] {
  const out: { title: string | null; items: T[] }[] = [];
  for (const b of list) {
    if (out.length === 0 || b.gapBefore) out.push({ title: b.gapBefore ? (b.groupTitle ?? null) : null, items: [b] });
    else out[out.length - 1].items.push(b);
  }
  return out;
}

/** Junta botões seguidos em meia largura na mesma linha (2 por linha). */
export function halfRows<T extends Pick<LinkButtonData, "half">>(items: T[]): T[][] {
  const out: T[][] = [];
  for (const b of items) {
    const last = out[out.length - 1];
    if (b.half && last && last.length === 1 && last[0].half) last.push(b);
    else out.push([b]);
  }
  return out;
}

export type VisitStats = { people: number; visits: number; peopleToday: number; visitsToday: number };

/** Tudo que o painel recebe da API de uma vez. */
export type AdminData = {
  buttons: LinkButtonData[];
  socials: SocialData[];
  page: PageData;
  clicks: Record<string, number>;
  visits: VisitStats | null;
  /** Momento em que o painel carregou estes dados (para saber o que está agendado ou vencido). */
  loadedAt: number;
};
