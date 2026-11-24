import type { CSSProperties, ReactNode } from "react";
import { NO_COLORS, type Animation, type ButtonColors, type ButtonStyle, type IconRef } from "@/lib/content-types";
import { externalLinkProps } from "@/lib/links";
import { BrandIcon } from "./BrandIcon";

/**
 * Botão da página, no visual da Set Up.
 *
 * IMPORTANTE: a página pública é montada pelo PHP (php/api/lib/pagina.php, função botao_html),
 * que gera exatamente este mesmo HTML. Mudou aqui, mude lá também.
 */
export const STYLES: Record<ButtonStyle, { body: string; icon: string; sub: string; ring: string; shine: string }> = {
  white: {
    body: "border-raisin/10 bg-white text-raisin group-hover:border-sunset group-active:border-sunset",
    icon: "text-sunset",
    sub: "text-raisin/70",
    ring: "border-sunset",
    shine: "promo-shine-warm",
  },
  orange: { body: "border-sunset bg-sunset text-white", icon: "text-white", sub: "text-white/85", ring: "border-sunset", shine: "" },
  blue: { body: "border-sky bg-sky text-raisin", icon: "text-raisin", sub: "text-raisin/75", ring: "border-sky", shine: "" },
  lilac: { body: "border-lilac bg-lilac text-raisin", icon: "text-raisin", sub: "text-raisin/75", ring: "border-lilac", shine: "" },
  purple: { body: "border-raisin bg-raisin text-shell", icon: "text-sunset", sub: "text-shell/80", ring: "border-raisin", shine: "" },
  featured: {
    body: "border-raisin/10 bg-white text-raisin group-hover:border-sunset group-active:border-sunset",
    icon: "text-sunset",
    sub: "text-raisin/70",
    ring: "border-sunset",
    shine: "promo-shine-warm",
  },
};

export type LinkCardProps = {
  id?: string;
  label: string;
  subtitle?: string | null;
  badge?: string | null;
  url: string;
  icon: IconRef;
  style: ButtonStyle;
  colors?: ButtonColors;
  animation: Animation;
  /** Meia largura: divide a linha com o vizinho. */
  half?: boolean;
  /** Na pré-visualização do painel o botão não navega. */
  preview?: boolean;
  /** Pré-visualização de uma imagem ainda não salva. */
  iconPreviewSrc?: string | null;
};

export function Badge({ text }: { text: string }) {
  return (
    <span className="absolute -top-3 right-5 z-10 rotate-2 rounded-full border-2 border-raisin bg-shell px-3 py-0.5 text-[11px] leading-5 font-bold tracking-wide text-raisin uppercase sm:text-[12px]">
      {text}
    </span>
  );
}

export function LinkCard({ id, label, subtitle, badge, url, icon, style, colors = NO_COLORS, animation, half, preview, iconPreviewSrc }: LinkCardProps) {
  const s = STYLES[style] ?? STYLES.white;
  const shine = animation === "shine" || animation === "both";
  const pulse = animation === "pulse" || animation === "both";
  const text = label || "Texto do botão";
  const hasIcon = icon.type !== "none" || !!iconPreviewSrc;
  const iconStyle: CSSProperties | undefined = colors.icon ? { color: colors.icon } : undefined;
  const bodyStyle: CSSProperties = {
    ...(colors.bg ? { backgroundColor: colors.bg, borderColor: colors.bg } : {}),
    ...(colors.text ? { color: colors.text } : {}),
  };
  const badgeEl = badge ? <Badge text={badge} /> : null;

  // ---------- Sem link: aviso, não parece clicável ----------
  if (!url && style !== "featured") {
    return (
      <div
        className="relative flex min-h-[50px] items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-raisin/25 px-4 py-2.5 text-center text-raisin sm:min-h-14 sm:rounded-[22px]"
        style={colors.text ? { color: colors.text } : undefined}
      >
        {hasIcon ? (
          <span className={`flex shrink-0 ${colors.icon ? "" : "text-sunset"}`} style={iconStyle}>
            <BrandIcon icon={icon} previewSrc={iconPreviewSrc} className="size-[18px]" />
          </span>
        ) : null}
        <span className="text-[14.5px] leading-snug font-semibold">{text}</span>
        {badgeEl}
      </div>
    );
  }

  const ring = pulse ? <span aria-hidden className={`promo-ring ${s.ring}`} style={colors.bg ? { borderColor: colors.bg } : undefined} /> : null;
  const shineEl = shine ? <span aria-hidden className={`promo-shine ${s.shine}`} /> : null;
  let inner: ReactNode;

  if (style === "featured") {
    // Destaque com imagem: imagem 16:9 em cima e o texto embaixo.
    const thumb = iconPreviewSrc ?? (icon.type === "custom" ? `/media/${icon.mediaId}` : null);
    inner = (
      <>
        {ring}
        <span className={`promo-body overflow-hidden rounded-[22px] border-2 ${s.body}`} style={bodyStyle}>
          {shineEl}
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" className="block aspect-video w-full object-cover" loading="lazy" decoding="async" />
          ) : (
            <span className="flex aspect-video w-full items-center justify-center bg-raisin/5 text-[13px] text-raisin/60">Sem imagem ainda</span>
          )}
          <span className="flex w-full flex-col px-4 pt-3 pb-3.5 text-center">
            <span className="text-[16px] leading-snug font-semibold tracking-[-0.01em] break-words">{text}</span>
            {subtitle ? <span className={`mt-0.5 text-[13px] leading-snug break-words sm:text-[14px] ${colors.text ? "opacity-75" : s.sub}`}>{subtitle}</span> : null}
          </span>
        </span>
        {badgeEl}
      </>
    );
  } else if (half) {
    inner = (
      <>
        {ring}
        <span className={`promo-body min-h-[50px] rounded-[18px] border-2 px-3 py-2 sm:min-h-14 sm:rounded-[20px] ${s.body}`} style={bodyStyle}>
          {shineEl}
          <span className="flex max-w-full min-w-0 items-center justify-center gap-2">
            {hasIcon ? (
              <span className={`flex shrink-0 ${colors.icon ? "" : s.icon}`} style={iconStyle}>
                <BrandIcon icon={icon} previewSrc={iconPreviewSrc} className="size-[18px]" />
              </span>
            ) : null}
            <span className="min-w-0 truncate text-[14.5px] leading-snug font-semibold">{text}</span>
          </span>
        </span>
        {badgeEl}
      </>
    );
  } else {
    inner = (
      <>
        {ring}
        <span
          className={`promo-body min-h-[50px] rounded-[20px] border-2 py-2.5 text-center sm:min-h-14 sm:rounded-[22px] sm:py-3 ${hasIcon ? "px-12 sm:px-14" : "px-5 sm:px-6"} ${s.body}`}
          style={bodyStyle}
        >
          {shineEl}
          {hasIcon ? (
            <span className={`absolute top-1/2 left-4 flex -translate-y-1/2 sm:left-5 ${colors.icon ? "" : s.icon}`} style={iconStyle}>
              <BrandIcon icon={icon} previewSrc={iconPreviewSrc} className="size-5 sm:size-6" />
            </span>
          ) : null}
          <span className="text-[15px] leading-snug font-semibold tracking-[-0.01em] break-words sm:text-[16px]">{text}</span>
          {subtitle ? <span className={`mt-0.5 text-[13px] leading-snug break-words sm:text-[14px] ${colors.text ? "opacity-75" : s.sub}`}>{subtitle}</span> : null}
        </span>
        {badgeEl}
      </>
    );
  }

  if (preview || !url) return <div className="promo group">{inner}</div>;
  return (
    <a href={url} {...externalLinkProps(url)} data-track={id} className="promo group">
      {inner}
    </a>
  );
}
