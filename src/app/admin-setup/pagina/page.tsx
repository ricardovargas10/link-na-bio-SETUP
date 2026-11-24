"use client";

import { useAdmin } from "../AdminData";
import { LogoForm, TextsForm } from "../PageForms";
import { Alert } from "../fields";
import { ListSkeleton } from "../Skeleton";

export default function PageSettingsPage() {
  const { data } = useAdmin();
  if (data === null) return <ListSkeleton />;

  return (
    <div>
      <h1 className="text-[28px] leading-tight font-semibold">Página</h1>
      <p className="mt-1 text-[15px]">Logo e textos que aparecem acima e abaixo dos botões.</p>

      {data === "erro" ? (
        <div className="mt-6">
          <Alert kind="error">Não consegui carregar agora. Atualize a página em instantes.</Alert>
        </div>
      ) : (
        <>
          <section aria-labelledby="logo" className="mt-6 rounded-3xl border-2 border-raisin/10 bg-white/80 p-4">
            <h2 id="logo" className="mb-3 text-[20px] font-semibold">
              Logo
            </h2>
            <LogoForm logoMediaId={data.page.logoMediaId} />
          </section>

          <section aria-labelledby="textos" className="mt-6 rounded-3xl border-2 border-raisin/10 bg-white/80 p-4">
            <h2 id="textos" className="mb-3 text-[20px] font-semibold">
              Textos
            </h2>
            <TextsForm initial={data.page} />
          </section>
        </>
      )}
    </div>
  );
}
