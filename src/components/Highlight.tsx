import type { ReactNode } from "react";

/** Caixa de cor chapada atrás do texto, levemente inclinada, como marca-texto. */
export function Highlight({ children, className = "bg-sky" }: { children: ReactNode; className?: string }) {
  return (
    <span className="relative inline-block whitespace-nowrap px-1.5">
      <span aria-hidden className={`absolute inset-x-0 inset-y-[0.06em] -rotate-[1.5deg] rounded-[6px] ${className}`} />
      <span className="relative">{children}</span>
    </span>
  );
}
