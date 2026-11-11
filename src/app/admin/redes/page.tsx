import Link from "next/link";
import { ArrowDown, ArrowUp, Eye, EyeOff, MousePointerClick, Pencil, Plus, Trash2 } from "lucide-react";
import { BrandIcon } from "@/components/BrandIcon";
import { requireAdminPage } from "@/lib/session";
import { readClicks, readSocials } from "@/lib/content";
import { deleteSocialAction, moveSocialAction, toggleSocialAction } from "../actions";
import { ConfirmForm, SubmitButton } from "../ui";
import { actionBtn, iconBtn } from "../styles";

export const instant = false;

export default async function SocialsPage() {
  const base = await requireAdminPage();

  let data: { socials: Awaited<ReturnType<typeof readSocials>>; clicks: Record<string, number> } | null = null;
  try {
    const [socials, clicks] = await Promise.all([readSocials(), readClicks()]);
    data = { socials, clicks };
  } catch {
    data = null;
  }

  return (
    <>
      <h1 className="text-[28px] leading-tight font-extrabold tracking-[-0.03em]">Redes</h1>
      <p className="mt-1 text-[15px]">Ícones pequenos que aparecem lado a lado, embaixo dos botões.</p>

      <Link href={`${base}/rede/nova`} className="mt-5 flex min-h-14 items-center justify-center gap-2 rounded-[20px] bg-sunset text-[17px] font-bold text-raisin">
        <Plus className="size-5" aria-hidden /> Nova rede
      </Link>

      {!data ? (
        <p role="alert" className="mt-6 rounded-2xl bg-sunset/15 px-4 py-3 font-semibold">
          Não consegui carregar as redes agora. Atualize a página em instantes.
        </p>
      ) : data.socials.length === 0 ? (
        <p className="mt-8 rounded-3xl border-2 border-dashed border-raisin/25 p-6 text-center">
          Nenhuma rede ainda. Toque em <strong>Nova rede</strong> para adicionar.
        </p>
      ) : (
        <ol className="mt-6 flex flex-col gap-3">
          {data.socials.map((s, i, all) => {
            const clicks = data.clicks[s.id] ?? 0;
            return (
              <li key={s.id} className="rounded-3xl border-2 border-raisin/10 bg-white/80 p-4">
                <div className="flex items-center gap-3">
                  <span className={`flex size-12 shrink-0 items-center justify-center rounded-full bg-shell ${s.visible ? "" : "opacity-40"}`}>
                    <BrandIcon icon={s.icon} className="size-[26px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] font-bold">
                      {s.label} {s.visible ? null : <span className="text-[13px] font-semibold text-raisin/60">(oculta)</span>}
                    </p>
                    <p className="truncate text-[13px] text-raisin/70">{s.url}</p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-[13px] font-semibold text-raisin/75">
                      <MousePointerClick className="size-4" aria-hidden /> {clicks} {clicks === 1 ? "clique" : "cliques"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
                    <form action={moveSocialAction.bind(null, s.id, "up")}>
                      <SubmitButton className={iconBtn} disabled={i === 0} aria-label={`Mover "${s.label}" para a esquerda`}>
                        <ArrowUp className="size-5" aria-hidden />
                      </SubmitButton>
                    </form>
                    <form action={moveSocialAction.bind(null, s.id, "down")}>
                      <SubmitButton className={iconBtn} disabled={i === all.length - 1} aria-label={`Mover "${s.label}" para a direita`}>
                        <ArrowDown className="size-5" aria-hidden />
                      </SubmitButton>
                    </form>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={toggleSocialAction.bind(null, s.id)}>
                    <SubmitButton className={actionBtn}>
                      {s.visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                      {s.visible ? "Ocultar" : "Mostrar"}
                    </SubmitButton>
                  </form>
                  <Link href={`${base}/rede/${s.id}`} className={actionBtn}>
                    <Pencil className="size-4" aria-hidden /> Editar
                  </Link>
                  <ConfirmForm action={deleteSocialAction.bind(null, s.id)} message={`Excluir "${s.label}" das redes? Não dá para desfazer.`}>
                    <SubmitButton className={`${actionBtn} text-[#B3261E]`}>
                      <Trash2 className="size-4" aria-hidden /> Excluir
                    </SubmitButton>
                  </ConfirmForm>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
