import Image from "next/image";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { Highlight } from "@/components/Highlight";
import { LinkCard } from "@/components/LinkCard";
import { SocialRow } from "@/components/SocialRow";
import { ClickTracker } from "@/components/ClickTracker";
import { BrandBackground } from "@/components/BrandBackground";
import { getPublicContent } from "@/lib/content";
import {
  DEFAULT_PAGE,
  DEFAULT_SOCIALS,
  defaultButtons,
  renderFooter,
  splitHeadline,
  type PublicContentShape,
} from "@/lib/content-types";
import { spYear } from "@/lib/time";
import logo from "../../public/brand/logo.png";

async function currentYear() {
  "use cache";
  cacheLife("days");
  return spYear(new Date());
}

/** A página inteira, com os textos, botões e redes salvos no painel. */
async function Content() {
  const [content, year] = await Promise.all([getPublicContent(), currentYear()]);
  return <PageView content={content} year={year} />;
}

function PageView({ content, year }: { content: PublicContentShape; year: number }) {
  const { page, buttons, socials } = content;
  const [before, highlight, after] = splitHeadline(page.headline, page.highlight);

  return (
    <>
      <div className="flex justify-center">
        {page.logoMediaId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/media/${page.logoMediaId}`}
            alt="Set Up"
            className="h-auto max-h-24 w-[130px] object-contain sm:w-[190px]"
            fetchPriority="high"
          />
        ) : (
          <Image src={logo} alt="Set Up" priority sizes="190px" className="h-auto w-[130px] sm:w-[190px]" />
        )}
      </div>

      {page.headline ? (
        <p className="text-[22px] leading-[1.2] font-extrabold tracking-[-0.03em] text-balance sm:text-[30px]">
          {before}
          {highlight ? <Highlight>{highlight}</Highlight> : null}
          {after}
        </p>
      ) : null}

      <div className="flex flex-col gap-5">
        {buttons.length > 0 ? (
          <nav aria-label="Links" className="flex flex-col gap-3 text-left">
            {buttons.map((b) => (
              <LinkCard
                key={b.id}
                id={b.id}
                label={b.label}
                subtitle={b.subtitle}
                badge={b.badge}
                url={b.url}
                icon={b.icon}
                style={b.style}
                animation={b.animation}
              />
            ))}
          </nav>
        ) : null}
        <SocialRow socials={socials} />
      </div>

      {page.aboutTitle || page.aboutText ? (
        <section aria-labelledby={page.aboutTitle ? "sobre" : undefined}>
          {page.aboutTitle ? (
            <h2 id="sobre" className="text-[16px] font-extrabold tracking-[-0.02em] sm:text-[19px]">
              {page.aboutTitle}
            </h2>
          ) : null}
          {page.aboutText ? (
            <p className="mx-auto mt-1.5 max-w-[400px] text-[13.5px] leading-relaxed whitespace-pre-line text-pretty text-raisin/85 sm:text-[15px]">
              {page.aboutText}
            </p>
          ) : null}
        </section>
      ) : null}

      <footer className="text-center text-[12px] font-medium text-raisin/80 sm:text-[13px]">
        {page.footer ? <p>{renderFooter(page.footer, year)}</p> : null}
      </footer>
    </>
  );
}

const FALLBACK: PublicContentShape = { page: DEFAULT_PAGE, buttons: defaultButtons(), socials: DEFAULT_SOCIALS };

export default function Home() {
  return (
    <>
      <BrandBackground />
      {/* Blocos espalhados na altura da tela; com muitos botões, a página rola. */}
      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-stretch justify-between gap-6 px-5 pt-16 pb-12 text-center sm:gap-8 sm:pt-20 sm:pb-14">
        <h1 className="sr-only">Set Up | Escola de inglês para brasileiros</h1>
        <Suspense fallback={<PageView content={FALLBACK} year={2026} />}>
          <Content />
        </Suspense>
      </main>
      <ClickTracker />
    </>
  );
}
