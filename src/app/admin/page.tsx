import Link from "next/link";
import { ArrowDown, ArrowUp, Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { requireAdminPage } from "@/lib/session";
import { readPromosWithStatus } from "@/lib/promos";
import { DEFAULT_FORM_URL, readSettings } from "@/lib/settings";
import { COLOR_LABELS, type Promo, type PromoStatus } from "@/lib/promo-types";
import { formatSp } from "@/lib/time";
import {
  deletePromoAction,
  duplicatePromoAction,
  logoutAction,
  movePromoAction,
  togglePromoAction,
} from "./actions";
import { ConfirmForm, SubmitButton } from "./ui";
import { FormUrlForm } from "./FormUrlForm";

const STATUS: Record<PromoStatus, { label: string; className: string; help: string }> = {
  ativa: { label: "No ar", className: "bg-sky", help: "Aparecendo na página agora" },
  agendada: { label: "Agendada", className: "bg-lilac-light", help: "Vai aparecer na data de início" },
  expirada: { label: "Encerrada", className: "bg-raisin/10", help: "A data de fim já passou" },
  desligada: { label: "Desligada", className: "bg-white border-2 border-raisin/25", help: "Não aparece na página" },
};

const SWATCH: Record<Promo["color"], string> = {
  orange: "bg-sunset",
  blue: "bg-sky",
  lilac: "bg-lilac",
  purple: "bg-raisin",
};

const iconBtn =
  "inline-flex size-11 items-center justify-center rounded-2xl border-2 border-raisin/20 bg-white disabled:opacity-30";
const actionBtn =
  "inline-flex min-h-11 items-center gap-1.5 rounded-2xl border-2 border-raisin/20 bg-white px-3.5 text-[14px] font-semibold";

function period(p: Promo): string {
  if (p.startsAt && p.endsAt) return `De ${formatSp(p.startsAt)} até ${formatSp(p.endsAt)}`;
  if (p.startsAt) return `A partir de ${formatSp(p.startsAt)}`;
  if (p.endsAt) return `Até ${formatSp(p.endsAt)}`;
  return "Sem datas: fica no ar enquanto estiver ligada";
}

export const instant = false;

export default async function AdminHome() {
  const base = await requireAdminPage();

  let promos: (Promo & { status: PromoStatus })[] = [];
  let loadError = false;
  let formUrl = DEFAULT_FORM_URL;
  try {
    promos = await readPromosWithStatus();
    formUrl = (await readSettings()).formUrl;
  } catch {
    loadError = true;
  }

  return (
    <>
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-[28px] leading-tight font-extrabold tracking-[-0.03em]">Promoções</h1>
        <form action={logoutAction}>
          <SubmitButton className="min-h-11 rounded-2xl px-4 text-[15px] font-semibold underline underline-offset-4">
            Sair
          </SubmitButton>
        </form>
      </header>
      <p className="mt-2 text-[15px]">
        Na página aparecem só as promoções <strong>ligadas</strong> e dentro das datas, nesta ordem.
      </p>

      <Link
        href={`${base}/nova`}
        className="mt-5 flex min-h-14 items-center justify-center gap-2 rounded-[20px] bg-sunset text-[17px] font-bold text-raisin"
      >
        <Plus className="size-5" aria-hidden /> Nova promoção
      </Link>

      {loadError ? (
        <p role="alert" className="mt-6 rounded-2xl bg-sunset/15 px-4 py-3 font-semibold">
          Não consegui carregar as promoções agora. Atualize a página em instantes.
        </p>
      ) : promos.length === 0 ? (
        <p className="mt-8 rounded-3xl border-2 border-dashed border-raisin/25 p-6 text-center">
          Nenhuma promoção ainda. Toque em <strong>Nova promoção</strong> para criar a primeira.
        </p>
      ) : (
        <ol className="mt-6 flex flex-col gap-4">
          {promos.map((p, i) => {
            const s = STATUS[p.status];
            return (
              <li key={p.id} className="rounded-3xl border-2 border-raisin/10 bg-white/80 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-bold uppercase tracking-wide ${s.className}`}
                      title={s.help}
                    >
                      {s.label}
                    </span>
                    <p className="mt-2 text-[18px] leading-snug font-bold break-words">{p.title}</p>
                    {p.subtitle ? <p className="text-[14px] break-words">{p.subtitle}</p> : null}
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <form action={movePromoAction.bind(null, p.id, "up")}>
                      <SubmitButton className={iconBtn} disabled={i === 0} aria-label={`Subir "${p.title}"`}>
                        <ArrowUp className="size-5" aria-hidden />
                      </SubmitButton>
                    </form>
                    <form action={movePromoAction.bind(null, p.id, "down")}>
                      <SubmitButton
                        className={iconBtn}
                        disabled={i === promos.length - 1}
                        aria-label={`Descer "${p.title}"`}
                      >
                        <ArrowDown className="size-5" aria-hidden />
                      </SubmitButton>
                    </form>
                  </div>
                </div>

                <dl className="mt-3 space-y-1 text-[13px] text-raisin/80">
                  <div className="flex items-center gap-2">
                    <dt className="sr-only">Cor</dt>
                    <dd className="flex items-center gap-1.5">
                      <span className={`inline-block size-3.5 rounded-full ${SWATCH[p.color]}`} aria-hidden />
                      {COLOR_LABELS[p.color]}
                      {p.badge ? <span>· Selo: {p.badge}</span> : null}
                    </dd>
                  </div>
                  <div>
                    <dt className="sr-only">Período</dt>
                    <dd>{period(p)}</dd>
                  </div>
                  <div>
                    <dt className="sr-only">Link</dt>
                    <dd className="truncate">{p.url}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <form action={togglePromoAction.bind(null, p.id)}>
                    <SubmitButton
                      role="switch"
                      aria-checked={p.active}
                      aria-label={p.active ? `Desligar "${p.title}"` : `Ligar "${p.title}"`}
                      className={`inline-flex min-h-11 items-center gap-2 rounded-2xl px-3.5 text-[14px] font-bold ${
                        p.active ? "bg-raisin text-shell" : "border-2 border-raisin/25 bg-white"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`relative block h-5 w-9 shrink-0 rounded-full ${p.active ? "bg-sunset" : "bg-raisin/20"}`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white transition-transform ${
                            p.active ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </span>
                      {p.active ? "Ligada" : "Desligada"}
                    </SubmitButton>
                  </form>
                  <Link href={`${base}/editar/${p.id}`} className={actionBtn}>
                    <Pencil className="size-4" aria-hidden /> Editar
                  </Link>
                  <form action={duplicatePromoAction.bind(null, p.id)}>
                    <SubmitButton className={actionBtn}>
                      <Copy className="size-4" aria-hidden /> Duplicar
                    </SubmitButton>
                  </form>
                  <ConfirmForm
                    action={deletePromoAction.bind(null, p.id)}
                    message={`Excluir a promoção "${p.title}"? Não dá para desfazer.`}
                  >
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

      <section aria-labelledby="config" className="mt-10 rounded-3xl border-2 border-raisin/10 bg-white/80 p-4">
        <h2 id="config" className="text-[20px] font-extrabold tracking-[-0.02em]">
          Link do formulário
        </h2>
        <p className="mt-1 text-[14px] text-raisin/75">Para onde vai o botão do formulário na página.</p>
        <FormUrlForm initialUrl={formUrl} />
      </section>
    </>
  );
}
