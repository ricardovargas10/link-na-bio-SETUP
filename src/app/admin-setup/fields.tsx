"use client";

import type { ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

export const inputClass =
  "mt-1.5 block w-full min-h-12 rounded-[14px] border-[1.5px] border-admin-border bg-white px-3.5 text-[16px] outline-none transition-shadow placeholder:text-admin-faint focus:border-raisin focus:shadow-[0_0_0_3px_rgba(41,29,41,0.16)] aria-[invalid=true]:border-danger aria-[invalid=true]:bg-[#fff6f5] disabled:bg-[#f2edee] disabled:text-[#a79ca7]";

/** Campo com rótulo, contador de caracteres, dica e erro (erro sempre com ícone + texto). */
export function Field({
  id,
  label,
  hint,
  count,
  max,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  count?: number;
  max?: number;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[14.5px] font-semibold">
          {label}
        </label>
        {max !== undefined ? (
          <span className={`text-[12.5px] tabular-nums ${(count ?? 0) >= max ? "font-bold text-danger" : "text-admin-faint"}`}>
            {count}/{max}
          </span>
        ) : null}
      </div>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-[13px] leading-snug text-admin-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1.5 text-[13.5px] font-semibold text-danger">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden /> {error}
        </p>
      ) : null}
    </div>
  );
}

/** Interruptor liga/desliga (checkbox). */
export function Toggle({
  name,
  checked,
  onChange,
  title,
  description,
}: {
  name: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-[14px] border-[1.5px] border-admin-border bg-white px-3.5 py-2.5 has-[:focus-visible]:shadow-[0_0_0_3px_#ffffff,0_0_0_6px_#291d29]">
      <span>
        <span className="block text-[14.5px] font-semibold">{title}</span>
        <span className="block text-[13px] leading-snug text-admin-muted">{description}</span>
      </span>
      <input type="checkbox" name={name} checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span aria-hidden className={`relative block h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? "bg-success" : "bg-[#d9d0d2]"}`}>
        <span className={`absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </span>
    </label>
  );
}

const ALERT = {
  error: { box: "bg-danger-bg border-danger-line text-[#8c1d16]", Icon: AlertCircle },
  success: { box: "bg-success-bg border-[#c7e6d2] text-success-text", Icon: CheckCircle2 },
  warning: { box: "bg-warning-bg border-[#ecd9ab] text-warning-text", Icon: AlertTriangle },
} as const;

/** Aviso com ícone: erro, sucesso ou atenção. */
export function Alert({ kind, children }: { kind: keyof typeof ALERT; children: ReactNode }) {
  const { box, Icon } = ALERT[kind];
  return (
    <p role={kind === "success" ? "status" : "alert"} className={`flex items-start gap-2.5 rounded-[14px] border px-3.5 py-3 text-[14.5px] font-semibold ${box}`}>
      <Icon className="mt-0.5 size-[18px] shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

export function FormAlert({ error, ok }: { error?: string; ok?: string | null }) {
  if (error) return <Alert kind="error">{error}</Alert>;
  if (ok) return <Alert kind="success">{ok}</Alert>;
  return null;
}
