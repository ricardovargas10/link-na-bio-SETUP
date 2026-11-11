"use client";

import type { ReactNode } from "react";

export const inputClass =
  "mt-1.5 block w-full min-h-12 rounded-2xl border-2 border-raisin/25 bg-white px-4 text-[16px] outline-none focus:border-raisin aria-[invalid=true]:border-[#B3261E]";

/** Campo com rótulo, contador de caracteres, dica e erro. */
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
        <label htmlFor={id} className="text-[15px] font-semibold">
          {label}
        </label>
        {max !== undefined ? (
          <span className={`text-[13px] tabular-nums ${(count ?? 0) > max ? "font-bold text-[#B3261E]" : "text-raisin/70"}`}>
            {count}/{max}
          </span>
        ) : null}
      </div>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-[13px] text-raisin/70">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-[14px] font-semibold text-[#B3261E]">
          {error}
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
    <label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-2xl border-2 border-raisin/15 bg-white px-4 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-sunset">
      <span>
        <span className="block text-[15px] font-semibold">{title}</span>
        <span className="block text-[13px] text-raisin/70">{description}</span>
      </span>
      <input type="checkbox" name={name} checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span aria-hidden className={`relative block h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? "bg-sunset" : "bg-raisin/20"}`}>
        <span
          className={`absolute top-1 left-1 size-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </span>
    </label>
  );
}

export function FormAlert({ error, ok }: { error?: string; ok?: string | null }) {
  if (error) {
    return (
      <p role="alert" className="rounded-2xl bg-sunset/15 px-4 py-3 text-[15px] font-semibold">
        {error}
      </p>
    );
  }
  if (ok) {
    return (
      <p role="status" className="rounded-2xl bg-[#DDF3E4] px-4 py-3 text-[15px] font-semibold text-[#1E5E33]">
        {ok}
      </p>
    );
  }
  return null;
}
