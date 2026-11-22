import Image from "next/image";
import { cacheLife } from "next/cache";
import { Highlight } from "@/components/Highlight";
import { LinkCard } from "@/components/LinkCard";
import { BrandBackground } from "@/components/BrandBackground";
import { site } from "@/config/site";
import { spYear } from "@/lib/time";
import logo from "../../public/brand/logo.png";

async function Footer() {
  "use cache";
  cacheLife("days");
  return (
    <footer className="text-center text-[12px] font-medium text-raisin/80 sm:text-[13px]">
      <p>{site.footer.replaceAll("{ano}", String(spYear(new Date())))}</p>
    </footer>
  );
}

function Headline() {
  const i = site.highlight ? site.headline.indexOf(site.highlight) : -1;
  const [before, hl, after] =
    i < 0 ? [site.headline, "", ""] : [site.headline.slice(0, i), site.highlight, site.headline.slice(i + site.highlight.length)];
  return (
    <p className="text-[22px] leading-[1.2] font-extrabold tracking-[-0.03em] text-balance sm:text-[30px]">
      {before}
      {hl ? <Highlight>{hl}</Highlight> : null}
      {after}
    </p>
  );
}

export default function Home() {
  return (
    <>
      <BrandBackground />
      {/*
        Blocos (logo, texto, botões, sobre e rodapé) com espaço fixo entre eles e o conjunto
        centralizado na altura da tela. O espaço acompanha a altura da tela (7dvh), mas fica
        entre 40 e 72 px: em telas altas os blocos não se afastam; em telas baixas a página rola.
      */}
      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-stretch justify-center gap-[clamp(2.5rem,7dvh,4.5rem)] px-5 py-12 text-center sm:py-14">
        <h1 className="sr-only">Set Up | Escola de inglês para brasileiros</h1>

        <div className="flex justify-center">
          <Image src={logo} alt="Set Up" priority sizes="190px" className="h-auto w-[130px] sm:w-[190px]" />
        </div>

        <Headline />

        <nav aria-label="Links" className="flex flex-col gap-3 text-left">
          {site.buttons.map((b) => (
            <LinkCard key={b.label} label={b.label} url={b.url} icon={b.icon} destaque={b.destaque} />
          ))}
        </nav>

        <section aria-labelledby="sobre">
          <h2 id="sobre" className="text-[16px] font-extrabold tracking-[-0.02em] sm:text-[19px]">
            {site.aboutTitle}
          </h2>
          <p className="mx-auto mt-1.5 max-w-[400px] text-[13.5px] leading-relaxed text-pretty text-raisin/85 sm:text-[15px]">
            {site.aboutText}
          </p>
        </section>

        <Footer />
      </main>
    </>
  );
}
