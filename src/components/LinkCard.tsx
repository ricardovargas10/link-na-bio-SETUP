import type { IconName } from "@/lib/icon-names";
import { externalLinkProps } from "@/lib/links";
import { BrandIcon } from "./BrandIcon";

/** Botão branco com ícone laranja à esquerda. */
export function LinkCard({ label, url, icon }: { label: string; url: string; icon?: IconName }) {
  return (
    <a href={url} {...externalLinkProps(url)} className="promo group">
      <span
        className={`promo-body min-h-[50px] rounded-[20px] border-2 border-raisin/10 bg-white py-2.5 text-center text-raisin group-hover:border-sunset group-active:border-sunset sm:min-h-14 sm:rounded-[22px] sm:py-3 ${
          icon ? "px-12 sm:px-14" : "px-5 sm:px-6"
        }`}
      >
        {icon ? (
          <BrandIcon name={icon} className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-sunset sm:left-5 sm:size-6" />
        ) : null}
        <span className="text-[15px] leading-snug font-semibold tracking-[-0.01em] break-words sm:text-[16px]">{label}</span>
      </span>
    </a>
  );
}
