import type { PromoColor } from "@/lib/promo-types";
import { externalLinkProps } from "@/lib/links";

const colorClasses: Record<PromoColor, { body: string; ring: string }> = {
  orange: { body: "bg-sunset text-raisin", ring: "border-sunset" },
  blue: { body: "bg-sky text-raisin", ring: "border-sky" },
  lilac: { body: "bg-lilac text-raisin", ring: "border-lilac" },
  purple: { body: "bg-raisin text-shell", ring: "border-raisin" },
};

export type PromoButtonProps = {
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  url: string;
  color: PromoColor;
  /** Na pré-visualização do painel o botão não navega. */
  preview?: boolean;
};

export function PromoButton({ title, subtitle, badge, url, color, preview }: PromoButtonProps) {
  const c = colorClasses[color] ?? colorClasses.orange;
  const inner = (
    <>
      <span aria-hidden className={`promo-ring ${c.ring}`} />
      <span className={`promo-body min-h-[68px] px-5 py-3.5 text-center sm:min-h-[76px] sm:px-6 sm:py-4 ${c.body}`}>
        <span aria-hidden className="promo-shine" />
        <span className="text-[17px] leading-tight font-extrabold sm:text-[19px] tracking-[-0.02em] break-words">
          {title || "Título da promoção"}
        </span>
        {subtitle ? (
          <span className="mt-1 text-[13px] leading-snug font-medium break-words sm:text-[14px]">{subtitle}</span>
        ) : null}
      </span>
      {badge ? (
        <span className="absolute -top-3 right-5 rotate-2 rounded-full border-2 border-raisin bg-shell px-3 py-0.5 text-[12px] leading-5 font-bold tracking-wide text-raisin uppercase">
          {badge}
        </span>
      ) : null}
    </>
  );

  if (preview) {
    return <div className="promo">{inner}</div>;
  }
  return (
    <a href={url} {...externalLinkProps(url)} className="promo">
      {inner}
    </a>
  );
}
