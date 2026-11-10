import type { FixedLink } from "@/config/links";
import { LinkIcon } from "./icons";
import { externalLinkProps } from "@/lib/links";

export function LinkButton({ link }: { link: FixedLink }) {
  return (
    <a
      href={link.url}
      {...externalLinkProps(link.url)}
      className="link-btn relative flex min-h-14 items-center justify-center rounded-[22px] bg-raisin px-14 py-3 text-center text-[17px] font-semibold tracking-[-0.01em] text-shell transition-[transform,background-color,color] duration-150 hover:-translate-y-0.5 hover:bg-sunset hover:text-raisin active:-translate-y-0.5 active:bg-sunset active:text-raisin"
    >
      <LinkIcon icon={link.icon} className="absolute left-5 size-6 shrink-0" />
      <span>{link.label}</span>
    </a>
  );
}
