import { requireAdminPage } from "@/lib/session";
import { readPage } from "@/lib/content";
import { resetLogoAction } from "../actions";
import { LogoForm, TextsForm } from "../PageForms";

export const instant = false;

export default async function PageSettingsPage() {
  await requireAdminPage();
  let page: Awaited<ReturnType<typeof readPage>> | null = null;
  try {
    page = await readPage();
  } catch {
    page = null;
  }

  return (
    <>
      <h1 className="text-[28px] leading-tight font-extrabold tracking-[-0.03em]">Página</h1>
      <p className="mt-1 text-[15px]">Logo e textos que aparecem acima e abaixo dos botões.</p>

      {!page ? (
        <p role="alert" className="mt-6 rounded-2xl bg-sunset/15 px-4 py-3 font-semibold">
          Não consegui carregar agora. Atualize a página em instantes.
        </p>
      ) : (
        <>
          <section aria-labelledby="logo" className="mt-6 rounded-3xl border-2 border-raisin/10 bg-white/80 p-4">
            <h2 id="logo" className="mb-3 text-[20px] font-extrabold tracking-[-0.02em]">
              Logo
            </h2>
            <LogoForm logoMediaId={page.logoMediaId} resetAction={resetLogoAction} />
          </section>

          <section aria-labelledby="textos" className="mt-6 rounded-3xl border-2 border-raisin/10 bg-white/80 p-4">
            <h2 id="textos" className="mb-3 text-[20px] font-extrabold tracking-[-0.02em]">
              Textos
            </h2>
            <TextsForm initial={page} />
          </section>
        </>
      )}
    </>
  );
}
