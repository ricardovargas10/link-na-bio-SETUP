import type { Animation, ButtonStyle, IconRef } from "@/lib/content-types";
import { externalLinkProps } from "@/lib/links";
import { BrandIcon } from "./BrandIcon";

const STYLES: Record<ButtonStyle, { body: string; icon: string; ring: string; shine: string }> = {
  white: {
    body: "bg-white text-raisin border-2 border-raisin/10 group-hover:border-sunset group-active:border-sunset",
    icon: "text-sunset",
    ring: "border-sunset",
    shine: "promo-shine-warm",
  },
  orange: { body: "bg-sunset text-raisin", icon: "text-raisin", ring: "border-sunset", shine: "" },
  blue: { body: "bg-sky text-raisin", icon: "text-raisin", ring: "border-sky", shine: "" },
  lilac: { body: "bg-lilac text-raisin", icon: "text-raisin", ring: "border-lilac", shine: "" },
  purple: { body: "bg-raisin text-shell", icon: "text-sunset", ring: "border-raisin", shine: "" },
};

export type LinkCardProps = {
  id?: string;
  label: string;
  subtitle?: string | null;
  badge?: string | null;
  url: string;
  icon: IconRef;
  style: ButtonStyle;
  animation: Animation;
  /** Na pré-visualização do painel o botão não navega. */
  preview?: boolean;
  /** Pré-visualização de uma imagem ainda não salva. */
  iconPreviewSrc?: string | null;
};

export function LinkCard({ id, label, subtitle, badge, url, icon, style, animation, preview, iconPreviewSrc }: LinkCardProps) {
  const s = STYLES[style] ?? STYLES.white;
  const shine = animation === "shine" || animation === "both";
  const pulse = animation === "pulse" || animation === "both";
  const hasIcon = icon.type !== "none" || !!iconPreviewSrc;

  const inner = (
    <>
      {pulse ? <span aria-hidden className={`promo-ring ${s.ring}`} /> : null}
      <span
        className={`promo-body min-h-[50px] rounded-[20px] py-2.5 text-center sm:min-h-14 sm:rounded-[22px] sm:py-3 ${
          hasIcon ? "px-12 sm:px-14" : "px-5 sm:px-6"
        } ${s.body}`}
      >
        {shine ? <span aria-hidden className={`promo-shine ${s.shine}`} /> : null}
        {hasIcon ? (
          <BrandIcon
            icon={icon}
            previewSrc={iconPreviewSrc}
            className={`absolute top-1/2 left-4 size-5 -translate-y-1/2 sm:left-5 sm:size-6 ${s.icon}`}
          />
        ) : null}
        <span className="text-[15px] leading-snug font-semibold tracking-[-0.01em] break-words sm:text-[16px]">
          {label || "Texto do botão"}
        </span>
        {subtitle ? (
          <span className="mt-0.5 text-[13px] leading-snug font-medium break-words opacity-85 sm:text-[14px]">{subtitle}</span>
        ) : null}
      </span>
      {badge ? (
        <span className="absolute -top-3 right-5 z-10 rotate-2 rounded-full border-2 border-raisin bg-shell px-3 py-0.5 text-[11px] leading-5 font-bold tracking-wide text-raisin uppercase sm:text-[12px]">
          {badge}
        </span>
      ) : null}
    </>
  );

  if (preview) return <div className="promo group">{inner}</div>;
  return (
    <a href={url} {...externalLinkProps(url)} data-track={id} className="promo group">
      {inner}
    </a>
  );
}
