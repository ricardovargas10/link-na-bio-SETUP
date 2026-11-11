import Image from "next/image";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { aboutText, aboutTitle, fixedLinks, instagramHandle } from "@/config/links";
import { Highlight } from "@/components/Highlight";
import { LinkButton } from "@/components/LinkButton";
import { PromoButton } from "@/components/PromoButton";
import { BrandBackground } from "@/components/BrandBackground";
import { getPublicPromos } from "@/lib/promos";
import { getPublicSettings } from "@/lib/settings";
import { spYear } from "@/lib/time";
import logo from "../../public/brand/logo.png";

async function Promos() {
  const promos = await getPublicPromos();
  if (promos.length === 0) return null;

  return (
    <section aria-label="Promoções" className="flex flex-col gap-6">
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

function ContactLinks({ formUrl }: { formUrl?: string }) {
  const links = [...fixedLinks]
    .sort((a, b) => a.order - b.order)
    .map((link) => (link.icon === "form" && formUrl ? { ...link, url: formUrl } : link));
  return (
    <nav aria-label="Contatos" className="flex flex-col gap-3">
      {links.map((link) => (
        <LinkButton key={link.icon + link.label} link={link} />
      ))}
    </nav>
  );
}

/** Botões fixos com o link do formulário salvo no painel. */
async function ContactLinksWithSettings() {
  const { formUrl } = await getPublicSettings();
  return <ContactLinks formUrl={formUrl} />;
}

async function Footer() {
  "use cache";
  cacheLife("days");
  const year = spYear(new Date());
  return (
    <footer className="text-center text-[12px] font-medium text-raisin/80 sm:text-[13px]">
      <p>
        {instagramHandle} · {year}
      </p>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <BrandBackground />
      {/* Blocos espalhados na altura da tela: logo, slogan, botões, sobre e rodapé */}
      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-stretch justify-between gap-6 px-5 pt-16 pb-12 text-center sm:gap-8 sm:pt-20 sm:pb-14">
        <h1 className="sr-only">Set Up | Escola de inglês para brasileiros</h1>

        <div className="flex justify-center">
          <Image src={logo} alt="Set Up" priority sizes="190px" className="h-auto w-[130px] sm:w-[190px]" />
        </div>

        <p className="text-[22px] leading-[1.2] font-extrabold tracking-[-0.03em] text-balance sm:text-[30px]">
          O inglês começa aqui e leva você para <Highlight>onde você quiser</Highlight>
        </p>

        <div className="flex flex-col gap-6 text-left">
          <Suspense fallback={null}>
            <Promos />
          </Suspense>
          <Suspense fallback={<ContactLinks />}>
            <ContactLinksWithSettings />
          </Suspense>
        </div>

        <section aria-labelledby="sobre">
          <h2 id="sobre" className="text-[16px] font-extrabold tracking-[-0.02em] sm:text-[19px]">
            {aboutTitle}
          </h2>
          <p className="mx-auto mt-1.5 max-w-[400px] text-[13.5px] leading-relaxed text-pretty text-raisin/85 sm:text-[15px]">
            {aboutText}
          </p>
        </section>

        <Footer />
      </main>
    </>
  );
}
