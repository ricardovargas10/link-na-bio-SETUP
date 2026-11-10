import Image from "next/image";
import { cacheLife, cacheTag } from "next/cache";
import { fixedLinks, instagramHandle } from "@/config/links";
import { Highlight } from "@/components/Highlight";
import { LinkButton } from "@/components/LinkButton";
import { PromoButton } from "@/components/PromoButton";
import { BrandBackground } from "@/components/BrandBackground";
import { PROMOS_TAG, readPromosSafe, visiblePromos } from "@/lib/promos";
import { spYear } from "@/lib/time";
import logo from "../../public/brand/logo.png";

/**
 * Promoções ativas e dentro do período. Fica em cache e é refeita a cada 60s
 * (para respeitar o agendamento) ou na hora em que o painel salva algo.
 */
async function Promos() {
  "use cache";
  cacheTag(PROMOS_TAG);
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });

  const promos = visiblePromos(await readPromosSafe(), Date.now());
  if (promos.length === 0) return null;

  return (
    <section aria-label="Promoções" className="mt-9 flex flex-col gap-6">
      {promos.map((p) => (
        <PromoButton
          key={p.id}
          title={p.title}
          subtitle={p.subtitle}
          badge={p.badge}
          url={p.url}
          color={p.color}
        />
      ))}
    </section>
  );
}

async function Footer() {
  "use cache";
  cacheLife("days");
  const year = spYear(new Date());
  return (
    <footer className="mt-auto pt-12 text-center text-[13px] font-medium text-raisin/80">
      <p>
        {instagramHandle} · {year}
      </p>
    </footer>
  );
}

export default function Home() {
  const links = [...fixedLinks].sort((a, b) => a.order - b.order);

  return (
    <>
      <BrandBackground />
      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-5 pt-12 pb-8 sm:pt-16">
        <header className="flex flex-col items-center text-center">
          <h1 className="sr-only">Set Up | Escola de inglês para brasileiros</h1>
          <Image
            src={logo}
            alt="Set Up"
            priority
            sizes="220px"
            className="h-auto w-[200px] sm:w-[220px]"
          />
          <p className="mt-6 text-[13px] font-semibold tracking-[0.04em] uppercase">
            Escola de inglês para brasileiros
          </p>
          <p className="mt-4 text-[27px] leading-[1.18] font-extrabold tracking-[-0.035em] text-balance sm:text-[30px]">
            O inglês começa aqui e leva você para <Highlight>onde você quiser</Highlight>
          </p>
        </header>

        <Promos />

        <nav aria-label="Contatos" className="mt-7 flex flex-col gap-3">
          {links.map((link) => (
            <LinkButton key={link.url} link={link} />
          ))}
        </nav>

        <Footer />
      </main>
    </>
  );
}
