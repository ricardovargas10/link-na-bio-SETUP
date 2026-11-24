"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Copy, Eye, EyeOff, MousePointerClick, Pencil, Plus } from "lucide-react";
import { LinkCard } from "@/components/LinkCard";
import { ADMIN_PATH, deleteButton, duplicateButton, toggleButton } from "@/lib/api";
import { ANIMATION_LABELS, buttonStatus, type ButtonStatus, type LinkButtonData } from "@/lib/content-types";
import { formatSp } from "@/lib/time";
import { useAdmin } from "./AdminData";
import { ConfirmDelete } from "./ui";
import { Alert } from "./fields";
import { btnGhost, btnPrimary, btnSecondary } from "./styles";
import { SortableButtons } from "./SortableButtons";
import { ListSkeleton } from "./Skeleton";

const STATUS: Record<ButtonStatus, { label: string; chip: string; dot: string }> = {
  "no-ar": { label: "No ar", chip: "bg-success-bg text-success-text", dot: "bg-success" },
  agendado: { label: "Agendado", chip: "bg-warning-bg text-warning-text", dot: "bg-warning" },
  encerrado: { label: "Encerrado", chip: "bg-[#f2edee] text-[#4a3f4a]", dot: "bg-[#9a8f9a]" },
  oculto: { label: "Oculto", chip: "bg-white border-[1.5px] border-admin-border text-[#4a3f4a]", dot: "" },
};

function period(b: LinkButtonData): string | null {
  if (b.startsAt && b.endsAt) return `de ${formatSp(b.startsAt)} até ${formatSp(b.endsAt)}`;
  if (b.startsAt) return `entra ${formatSp(b.startsAt)}`;
  if (b.endsAt) return `some em ${formatSp(b.endsAt)}`;
  return null;
}

const chip = "inline-flex h-8 items-center gap-1.5 rounded-full border border-[#e9e2e4] bg-white px-3 text-[13.5px]";

/** Botão de ação rápida (ocultar, duplicar): mostra que está trabalhando. */
function QuickAction({ onClick, children, label }: { onClick: () => Promise<unknown>; children: React.ReactNode; label?: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-label={label}
      aria-busy={pending}
      disabled={pending}
      onClick={() => start(async () => void (await onClick().catch(() => {})))}
      className={`${btnGhost} aria-busy:opacity-60`}
    >
      {children}
    </button>
  );
}

export default function ButtonsPage() {
  const { data, run } = useAdmin();
  if (data === null) return <ListSkeleton />;
  if (data === "erro") {
    return <Alert kind="error">Não consegui carregar os botões agora. Atualize a página em instantes.</Alert>;
  }

  const now = data.loadedAt;
  const buttons = data.buttons.map((b) => ({ ...b, status: buttonStatus(b, now) }));
  const count = (s: ButtonStatus) => buttons.filter((b) => b.status === s).length;
  const totalClicks = Object.values(data.clicks).reduce((a, n) => a + n, 0);

  function header(b: (typeof buttons)[number], i: number) {
    const s = STATUS[b.status];
    const clicks = data !== "erro" && data ? (data.clicks[b.id] ?? 0) : 0;
    return (
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <span className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-semibold ${s.chip}`}>
          {s.dot ? <span aria-hidden className={`size-1.5 rounded-full ${s.dot}`} /> : null}
          {s.label}
        </span>
        <span className="inline-flex items-center gap-1 text-[13.5px] text-admin-muted" title="Cliques desde que o botão foi criado">
          <MousePointerClick className="size-4" aria-hidden /> {clicks.toLocaleString("pt-BR")} {clicks === 1 ? "clique" : "cliques"}
        </span>
        <span className="ml-auto text-[12.5px] text-admin-faint tabular-nums">{i + 1}º</span>
      </div>
    );
  }

  function body(b: (typeof buttons)[number]) {
    const when = period(b);
    const extra = [
      b.url ? b.url.replace(/^https?:\/\/(www\.)?/, "") : "sem link (aviso)",
      when,
      b.badge ? `selo "${b.badge}"` : null,
      b.animation !== "none" ? ANIMATION_LABELS[b.animation].toLowerCase() : null,
    ]
      .filter(Boolean)
      .join(" · ");
    return (
      <>
        <div className={`mt-3 rounded-[14px] border border-admin-line bg-shell px-3 pt-4 pb-3 ${b.visible ? "" : "opacity-50"}`}>
          <div className={b.half ? "mx-auto max-w-[60%]" : ""}>
            <LinkCard preview label={b.label} subtitle={b.subtitle} badge={b.badge} url={b.url} icon={b.icon} style={b.style} colors={b.colors} animation={b.animation} half={b.half} />
          </div>
        </div>
        <p className="mt-2.5 truncate text-[13px] text-admin-muted">{extra}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-0.5 gap-y-1">
          <Link href={`${ADMIN_PATH}/botao/?id=${b.id}`} className={btnSecondary}>
            <Pencil className="size-4" aria-hidden /> Editar
          </Link>
          <QuickAction onClick={() => run(() => toggleButton(b.id))} label={b.visible ? `Ocultar "${b.label}"` : `Mostrar "${b.label}"`}>
            {b.visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            {b.visible ? "Ocultar" : "Mostrar"}
          </QuickAction>
          <QuickAction onClick={() => run(() => duplicateButton(b.id))}>
            <Copy className="size-4" aria-hidden /> Duplicar
          </QuickAction>
          <ConfirmDelete compact action={() => run(() => deleteButton(b.id)).catch(() => {})} name={b.label} detail="Os cliques registrados vão junto." />
        </div>
      </>
    );
  }

  return (
    <div>
      {data.visits ? (
        <section aria-label="Quem abriu o link da bio" className="mb-6 rounded-[18px] border border-admin-line bg-white p-4 shadow-[0_1px_2px_rgba(41,29,41,0.05)]">
          <p className="text-[12px] font-bold tracking-[0.08em] text-admin-faint uppercase">Quem abriu o link da bio</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[28px] leading-none font-bold tabular-nums">{data.visits.people.toLocaleString("pt-BR")}</p>
              <p className="mt-1 text-[13.5px] text-admin-muted">{data.visits.people === 1 ? "pessoa" : "pessoas"} no total · {data.visits.peopleToday.toLocaleString("pt-BR")} hoje</p>
            </div>
            <div>
              <p className="text-[28px] leading-none font-bold tabular-nums">{data.visits.visits.toLocaleString("pt-BR")}</p>
              <p className="mt-1 text-[13.5px] text-admin-muted">{data.visits.visits === 1 ? "visita" : "visitas"} no total · {data.visits.visitsToday.toLocaleString("pt-BR")} hoje</p>
            </div>
          </div>
          <p className="mt-3 text-[12.5px] leading-snug text-admin-faint">Pessoas: cada celular ou computador conta uma vez. Visitas: cada vez que alguém abre a página.</p>
        </section>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1 basis-60">
          <h1 className="text-[24px] leading-tight font-bold">Botões</h1>
          <p className="mt-1 text-[14px] leading-snug text-admin-muted">Arraste pela alça para mudar a ordem. Ocultos e fora das datas não aparecem na página.</p>
        </div>
        <Link href={`${ADMIN_PATH}/botao/?id=novo`} className={`${btnPrimary} min-h-[46px]`}>
          <Plus className="size-5" aria-hidden /> Novo botão
        </Link>
      </div>

      {buttons.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className={chip}>
            <span aria-hidden className="size-1.5 rounded-full bg-success" /> {count("no-ar")} no ar
          </span>
          {count("agendado") ? (
            <span className={chip}>
              <span aria-hidden className="size-1.5 rounded-full bg-warning" /> {count("agendado")} {count("agendado") > 1 ? "agendados" : "agendado"}
            </span>
          ) : null}
          {count("oculto") ? (
            <span className={chip}>
              <span aria-hidden className="size-1.5 rounded-full bg-[#9a8f9a]" /> {count("oculto")} {count("oculto") > 1 ? "ocultos" : "oculto"}
            </span>
          ) : null}
          <span className={chip}>{totalClicks.toLocaleString("pt-BR")} {totalClicks === 1 ? "clique" : "cliques"}</span>
        </div>
      ) : null}

      {buttons.length === 0 ? (
        <div className="mt-6 rounded-[18px] border-2 border-dashed border-[#c9bec1] px-6 py-10 text-center">
          <p className="text-[17px] font-semibold">Nenhum botão ainda</p>
          <p className="mt-1 text-[14px] text-admin-muted">Os botões que você criar aparecem aqui e na página, nesta ordem.</p>
          <Link href={`${ADMIN_PATH}/botao/?id=novo`} className={`${btnPrimary} mt-4`}>
            <Plus className="size-5" aria-hidden /> Criar o primeiro botão
          </Link>
        </div>
      ) : (
        <SortableButtons
          key={buttons.map((b) => `${b.id}:${b.updatedAt}:${b.status}`).join()}
          items={buttons.map((b, i) => ({
            id: b.id,
            label: b.label,
            separator: i > 0 && b.gapBefore ? (b.groupTitle ?? "") : null,
            header: header(b, i),
            body: body(b),
          }))}
        />
      )}
    </div>
  );
}
