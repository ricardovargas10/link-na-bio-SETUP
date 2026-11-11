import Link from "next/link";
import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, MousePointerClick, Pencil, Plus, Trash2 } from "lucide-react";
import { LinkCard } from "@/components/LinkCard";
import { requireAdminPage } from "@/lib/session";
import { readButtons, readClicks } from "@/lib/content";
import { ANIMATION_LABELS, buttonStatus, type ButtonStatus, type LinkButtonData } from "@/lib/content-types";
import { formatSp } from "@/lib/time";
import { deleteButtonAction, duplicateButtonAction, moveButtonAction, toggleButtonAction } from "./actions";
import { ConfirmForm, SubmitButton } from "./ui";
import { actionBtn, iconBtn } from "./styles";

export const instant = false;

const STATUS: Record<ButtonStatus, { label: string; className: string }> = {
  "no-ar": { label: "No ar", className: "bg-sky" },
  agendado: { label: "Agendado", className: "bg-lilac-light" },
  encerrado: { label: "Encerrado", className: "bg-raisin/10" },
  oculto: { label: "Oculto", className: "bg-white border-2 border-raisin/25" },
};


function period(b: LinkButtonData): string | null {
  if (b.startsAt && b.endsAt) return `De ${formatSp(b.startsAt)} até ${formatSp(b.endsAt)}`;
  if (b.startsAt) return `A partir de ${formatSp(b.startsAt)}`;
  if (b.endsAt) return `Até ${formatSp(b.endsAt)}`;
  return null;
}

async function load() {
  const [buttons, clicks] = await Promise.all([readButtons(), readClicks()]);
  const now = Date.now();
  return { buttons: buttons.map((b) => ({ ...b, status: buttonStatus(b, now) })), clicks };
}

export default async function ButtonsPage() {
  const base = await requireAdminPage();

  let data: Awaited<ReturnType<typeof load>> | null = null;
  try {
    data = await load();
  } catch {
    data = null;
  }

  return (
    <>
      <h1 className="text-[28px] leading-tight font-extrabold tracking-[-0.03em]">Botões</h1>
      <p className="mt-1 text-[15px]">Aparecem na página nesta ordem. Os ocultos e fora das datas não aparecem.</p>

      <Link
        href={`${base}/botao/novo`}
        className="mt-5 flex min-h-14 items-center justify-center gap-2 rounded-[20px] bg-sunset text-[17px] font-bold text-raisin"
      >
        <Plus className="size-5" aria-hidden /> Novo botão
      </Link>

      {!data ? (
        <p role="alert" className="mt-6 rounded-2xl bg-sunset/15 px-4 py-3 font-semibold">
          Não consegui carregar os botões agora. Atualize a página em instantes.
        </p>
      ) : data.buttons.length === 0 ? (
        <p className="mt-8 rounded-3xl border-2 border-dashed border-raisin/25 p-6 text-center">
          Nenhum botão ainda. Toque em <strong>Novo botão</strong> para criar o primeiro.
        </p>
      ) : (
        <ol className="mt-6 flex flex-col gap-4">
          {data.buttons.map((b, i, all) => {
            const s = STATUS[b.status];
            const when = period(b);
            const clicks = data.clicks[b.id] ?? 0;
            return (
              <li key={b.id} className="rounded-3xl border-2 border-raisin/10 bg-white/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-bold tracking-wide uppercase ${s.className}`}>{s.label}</span>
                    <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-raisin/75" title="Cliques desde que o botão foi criado">
                      <MousePointerClick className="size-4" aria-hidden /> {clicks} {clicks === 1 ? "clique" : "cliques"}
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <form action={moveButtonAction.bind(null, b.id, "up")}>
                      <SubmitButton className={iconBtn} disabled={i === 0} aria-label={`Subir "${b.label}"`}>
                        <ArrowUp className="size-5" aria-hidden />
                      </SubmitButton>
                    </form>
                    <form action={moveButtonAction.bind(null, b.id, "down")}>
                      <SubmitButton className={iconBtn} disabled={i === all.length - 1} aria-label={`Descer "${b.label}"`}>
                        <ArrowDown className="size-5" aria-hidden />
                      </SubmitButton>
                    </form>
                  </div>
                </div>

                <div className={`mt-5 ${b.visible ? "" : "opacity-50"}`}>
                  <LinkCard preview label={b.label} subtitle={b.subtitle} badge={b.badge} url={b.url} icon={b.icon} style={b.style} animation={b.animation} />
                </div>

                <dl className="mt-3 space-y-0.5 text-[13px] text-raisin/75">
                  <div>
                    <dt className="sr-only">Link</dt>
                    <dd className="truncate">{b.url}</dd>
                  </div>
                  {b.animation !== "none" ? (
                    <div>
                      <dt className="sr-only">Animação</dt>
                      <dd>Animação: {ANIMATION_LABELS[b.animation]}</dd>
                    </div>
                  ) : null}
                  {when ? (
                    <div>
                      <dt className="sr-only">Período</dt>
                      <dd>{when}</dd>
                    </div>
                  ) : null}
                </dl>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <form action={toggleButtonAction.bind(null, b.id)}>
                    <SubmitButton className={actionBtn} aria-label={b.visible ? `Ocultar "${b.label}"` : `Mostrar "${b.label}"`}>
                      {b.visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                      {b.visible ? "Ocultar" : "Mostrar"}
                    </SubmitButton>
                  </form>
                  <Link href={`${base}/botao/${b.id}`} className={actionBtn}>
                    <Pencil className="size-4" aria-hidden /> Editar
                  </Link>
                  <form action={duplicateButtonAction.bind(null, b.id)}>
                    <SubmitButton className={actionBtn}>
                      <Copy className="size-4" aria-hidden /> Duplicar
                    </SubmitButton>
                  </form>
                  <ConfirmForm action={deleteButtonAction.bind(null, b.id)} message={`Excluir o botão "${b.label}"? Não dá para desfazer.`}>
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
