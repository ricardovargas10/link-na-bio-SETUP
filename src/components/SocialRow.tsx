import type { SocialData } from "@/lib/content-types";
import { externalLinkProps } from "@/lib/links";
import { BrandIcon } from "./BrandIcon";

/** Linha de ícones das redes, embaixo dos botões. */
export function SocialRow({ socials }: { socials: SocialData[] }) {
  if (socials.length === 0) return null;
  return (
    <nav aria-label="Redes sociais">
      <ul className="flex flex-wrap items-center justify-center gap-1.5">
        {socials.map((s) => (
          <li key={s.id}>
            <a
              href={s.url}
              {...externalLinkProps(s.url)}
              data-track={s.id}
              aria-label={s.label}
              title={s.label}
              className="flex size-11 items-center justify-center rounded-full text-raisin transition-[transform,color] duration-150 hover:-translate-y-0.5 hover:text-sunset"
            >
              <BrandIcon icon={s.icon} className="size-[26px]" />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
