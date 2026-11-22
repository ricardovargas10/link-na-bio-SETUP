import type { IconName } from "@/lib/icon-names";
import { externalLinkProps } from "@/lib/links";
import { BrandIcon } from "./BrandIcon";

/**
 * Botão da página.
 * - Padrão: branco, texto escuro, ícone laranja.
 * - Destaque: laranja, texto branco e brilho passando. O texto fica em negrito com 19px
 *   ("texto grande" pelo WCAG), que é o que mantém o contraste do branco sobre o laranja dentro do AA.
 */
export function LinkCard({ label, url, icon, destaque = false }: { label: string; url: string; icon?: IconName; destaque?: boolean }) {
  const body = destaque
    ? "border-sunset bg-sunset text-white"
    : "border-raisin/10 bg-white text-raisin group-hover:border-sunset group-active:border-sunset";
  const text = destaque
    ? "text-[19px] leading-snug font-bold tracking-[-0.01em]"
    : "text-[15px] leading-snug font-semibold tracking-[-0.01em] sm:text-[16px]";

  return (
    <a href={url} {...externalLinkProps(url)} className="promo group">
      <span
        className={`promo-body min-h-[50px] rounded-[20px] border-2 py-2.5 text-center sm:min-h-14 sm:rounded-[22px] sm:py-3 ${
          icon ? "px-12 sm:px-14" : "px-5 sm:px-6"
        } ${body}`}
      >
        {destaque ? <span aria-hidden className="promo-shine" /> : null}
        {icon ? (
          <BrandIcon
            name={icon}
            className={`absolute top-1/2 left-4 size-5 -translate-y-1/2 sm:left-5 sm:size-6 ${destaque ? "text-white" : "text-sunset"}`}
          />
        ) : null}
        <span className={`break-words ${text}`}>{label}</span>
      </span>
    </a>
  );
}
