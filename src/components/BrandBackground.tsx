import Image from "next/image";
import background from "../../public/brand/background.png";

/** Textura halftone da marca cobrindo a tela inteira, fixa atrás do conteúdo. */
export function BrandBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-shell">
      <Image src={background} alt="" fill sizes="100vw" quality={70} className="object-cover" />
    </div>
  );
}
