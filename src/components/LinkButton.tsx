import type { FixedLink } from "@/config/links";
import { LinkIcon } from "./icons";
import { externalLinkProps } from "@/lib/links";

export function LinkButton({ link }: { link: FixedLink }) {
  return (
    <a
      href={link.url}
      {...externalLinkProps(link.url)}
      className="link-btn group relative flex min-h-[50px] items-center justify-center rounded-[20px] border-2 border-raisin/10 bg-white px-12 py-2.5 text-center text-[15px] sm:min-h-14 sm:rounded-[22px] sm:px-14 sm:py-3 sm:text-[16px] leading-snug font-semibold tracking-[-0.01em] text-raisin transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-sunset active:-translate-y-0.5 active:border-sunset"
    >
      <LinkIcon icon={link.icon} className="absolute left-4 size-5 shrink-0 text-sunset sm:left-5 sm:size-6" />
      <span>{link.label}</span>
    </a>
  );
}
