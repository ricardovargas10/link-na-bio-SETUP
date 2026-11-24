"use client";

import Link from "next/link";
import { useTransition, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, MousePointerClick, Pencil, Plus } from "lucide-react";
import { BrandIcon } from "@/components/BrandIcon";
import { ADMIN_PATH, deleteSocial, moveSocial, toggleSocial } from "@/lib/api";
import { useAdmin } from "../AdminData";
import { ConfirmDelete } from "../ui";
import { Alert } from "../fields";
import { btnGhost, btnPrimary, btnSecondary, card, iconBtn } from "../styles";
import { ListSkeleton } from "../Skeleton";

function Quick({ onClick, className, label, disabled, children }: { onClick: () => Promise<unknown>; className: string; label?: string; disabled?: boolean; children: ReactNode }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-label={label}
      aria-busy={pending}
      disabled={pending || disabled}
      onClick={() => start(async () => void (await onClick().catch(() => {})))}
      className={`${className} aria-busy:opacity-60`}
    >
      {children}
    </button>
  );
}

export default function SocialsPage() {
  const { data, run } = useAdmin();
  if (data === null) return <ListSkeleton />;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1 basis-60">
          <h1 className="text-[24px] leading-tight font-bold">Redes</h1>
          <p className="mt-1 text-[14px] leading-snug text-admin-muted">Ícones lado a lado, embaixo dos botões, na ordem desta lista.</p>
        </div>
        <Link href={`${ADMIN_PATH}/rede/?id=nova`} className={`${btnPrimary} min-h-[46px]`}>
          <Plus className="size-5" aria-hidden /> Nova rede
        </Link>
      </div>

      {data === "erro" ? (
        <div className="mt-6">
          <Alert kind="error">Não consegui carregar as redes agora. Atualize a página em instantes.</Alert>
        </div>
      ) : data.socials.length === 0 ? (
        <div className="mt-6 rounded-[18px] border-2 border-dashed border-[#c9bec1] px-6 py-10 text-center">
          <p className="text-[17px] font-semibold">Nenhuma rede ainda</p>
          <p className="mt-1 text-[14px] text-admin-muted">Adicione Instagram, TikTok, YouTube e as outras.</p>
        </div>
      ) : (
        <ol className="mt-6 flex flex-col gap-3">
          {data.socials.map((s, i, all) => {
            const clicks = data.clicks[s.id] ?? 0;
            return (
              <li key={s.id} className={`${card} p-3.5 has-[[data-confirm=true]]:border-[#f0d4d2]`}>
                <div className="flex items-center gap-3">
                  <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl bg-sunset text-white ${s.visible ? "" : "opacity-40"}`}>
                    <BrandIcon icon={s.icon} className="size-[23px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15.5px] font-semibold">
                      {s.label} {s.visible ? null : <span className="text-[13px] font-medium text-admin-muted">(oculta)</span>}
                    </p>
                    <p className="truncate text-[13px] text-admin-muted">{s.url.replace(/^https?:\/\/(www\.)?/, "")}</p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-[13px] text-admin-muted">
                      <MousePointerClick className="size-4" aria-hidden /> {clicks.toLocaleString("pt-BR")} {clicks === 1 ? "clique" : "cliques"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <Quick onClick={() => run(() => moveSocial(s.id, "up"))} className={iconBtn} disabled={i === 0} label={`Mover "${s.label}" para a esquerda`}>
                      <ArrowUp className="size-5" aria-hidden />
                    </Quick>
                    <Quick onClick={() => run(() => moveSocial(s.id, "down"))} className={iconBtn} disabled={i === all.length - 1} label={`Mover "${s.label}" para a direita`}>
                      <ArrowDown className="size-5" aria-hidden />
                    </Quick>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Link href={`${ADMIN_PATH}/rede/?id=${s.id}`} className={btnSecondary}>
                    <Pencil className="size-4" aria-hidden /> Editar
                  </Link>
                  <Quick onClick={() => run(() => toggleSocial(s.id))} className={btnGhost}>
                    {s.visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                    {s.visible ? "Ocultar" : "Mostrar"}
                  </Quick>
                  <ConfirmDelete compact action={() => run(() => deleteSocial(s.id)).catch(() => {})} name={s.label} detail="O ícone sai da página." />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
