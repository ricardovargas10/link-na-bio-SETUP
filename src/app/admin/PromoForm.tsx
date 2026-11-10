"use client";

import Link from "next/link";
import { useActionState, useState, type ReactNode } from "react";
import { PromoButton } from "@/components/PromoButton";
import { COLOR_LABELS, LIMITS, PROMO_COLORS, type PromoColor } from "@/lib/promo-types";
import { savePromoAction, type SaveState } from "./actions";
import { SubmitButton } from "./ui";

export type PromoFormValues = {
  id?: string;
  title: string;
  subtitle: string;
  badge: string;
  url: string;
  color: PromoColor;
  active: boolean;
  startsAt: string; // "AAAA-MM-DDTHH:mm" no horário de Brasília, ou ""
  endsAt: string;
  position: number;
};

const SWATCH: Record<PromoColor, string> = {
  orange: "bg-sunset",
  blue: "bg-sky",
  lilac: "bg-lilac",
  purple: "bg-raisin",
};

const inputClass =
  "mt-1.5 block w-full min-h-12 rounded-2xl border-2 border-raisin/25 bg-white px-4 text-[16px] outline-none focus:border-raisin aria-[invalid=true]:border-[#B3261E]";

function Field({
  label,
  hint,
  count,
  max,
  error,
  id,
  children,
}: {
  label: string;
  hint?: string;
  count?: number;
  max?: number;
  error?: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[15px] font-semibold">
          {label}
        </label>
        {max !== undefined ? (
          <span className={`text-[13px] tabular-nums ${count! > max ? "font-bold text-[#B3261E]" : "text-raisin/70"}`}>
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

export function PromoForm({
  base,
  initial,
  maxPosition,
}: {
  base: string;
  initial: PromoFormValues;
  maxPosition: number;
}) {
  const [state, formAction] = useActionState<SaveState, FormData>(savePromoAction, {});
  const [v, setV] = useState(initial);
  const set = <K extends keyof PromoFormValues>(key: K, value: PromoFormValues[K]) =>
    setV((old) => ({ ...old, [key]: value }));
  const err = state.fieldErrors ?? {};
  const describedBy = (id: string, hint?: boolean) =>
    [hint ? `${id}-hint` : "", err[id] ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-6" noValidate>
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      {state.error ? (
        <p role="alert" className="rounded-2xl bg-sunset/15 px-4 py-3 text-[15px] font-semibold">
          {state.error}
        </p>
      ) : null}

      <Field id="title" label="Título" count={v.title.length} max={LIMITS.title} error={err.title}>
        <input
          id="title"
          name="title"
          value={v.title}
          onChange={(e) => set("title", e.target.value)}
          maxLength={LIMITS.title}
          required
          aria-invalid={!!err.title}
          aria-describedby={describedBy("title")}
          className={inputClass}
        />
      </Field>

      <Field
        id="subtitle"
        label="Subtítulo (opcional)"
        count={v.subtitle.length}
        max={LIMITS.subtitle}
        error={err.subtitle}
      >
        <input
          id="subtitle"
          name="subtitle"
          value={v.subtitle}
          onChange={(e) => set("subtitle", e.target.value)}
          maxLength={LIMITS.subtitle}
          aria-invalid={!!err.subtitle}
          aria-describedby={describedBy("subtitle")}
          className={inputClass}
        />
      </Field>

      <Field
        id="badge"
        label="Selo (opcional)"
        hint='Etiqueta pequena no canto do botão. Ex.: "Novo", "Vagas abertas".'
        count={v.badge.length}
        max={LIMITS.badge}
        error={err.badge}
      >
        <input
          id="badge"
          name="badge"
          value={v.badge}
          onChange={(e) => set("badge", e.target.value)}
          maxLength={LIMITS.badge}
          aria-invalid={!!err.badge}
          aria-describedby={describedBy("badge", true)}
          className={inputClass}
        />
      </Field>

      <fieldset>
        <legend className="text-[15px] font-semibold">Cor do botão</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PROMO_COLORS.map((c) => (
            <label
              key={c}
              className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl border-2 bg-white px-3 text-[15px] font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-sunset ${
                v.color === c ? "border-raisin" : "border-raisin/15"
              }`}
            >
              <input
                type="radio"
                name="color"
                value={c}
                checked={v.color === c}
                onChange={() => set("color", c)}
                className="sr-only"
              />
              <span className={`size-5 rounded-full ${SWATCH[c]}`} aria-hidden />
              {COLOR_LABELS[c]}
            </label>
          ))}
        </div>
        {err.color ? <p className="mt-1 text-[14px] font-semibold text-[#B3261E]">{err.color}</p> : null}
      </fieldset>

      <div>
        <p className="text-[15px] font-semibold">Como vai ficar na página</p>
        <div className="mt-2 rounded-3xl border-2 border-raisin/10 bg-shell px-4 pt-7 pb-5">
          <PromoButton
            preview
            title={v.title}
            subtitle={v.subtitle}
            badge={v.badge}
            url={v.url}
            color={v.color}
          />
        </div>
      </div>

      <Field
        id="url"
        label="Link"
        hint="Comece com https://, wa.me/ ou mailto:"
        error={err.url}
      >
        <input
          id="url"
          name="url"
          type="url"
          inputMode="url"
          autoCapitalize="none"
          spellCheck={false}
          value={v.url}
          onChange={(e) => set("url", e.target.value)}
          placeholder="https://"
          required
          aria-invalid={!!err.url}
          aria-describedby={describedBy("url", true)}
          className={inputClass}
        />
      </Field>

      <label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-2xl border-2 border-raisin/15 bg-white px-4 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-sunset">
        <span>
          <span className="block text-[15px] font-semibold">Ligada</span>
          <span className="block text-[13px] text-raisin/70">Desligada, ela não aparece na página.</span>
        </span>
        <input
          type="checkbox"
          name="active"
          checked={v.active}
          onChange={(e) => set("active", e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${v.active ? "bg-sunset" : "bg-raisin/20"}`}
        >
          <span
            className={`absolute top-1 left-1 size-5 rounded-full bg-white transition-transform ${
              v.active ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </span>
      </label>

      <fieldset className="flex flex-col gap-4">
        <legend className="text-[15px] font-semibold">Datas (opcional)</legend>
        <p className="-mt-2 text-[13px] text-raisin/70">
          Horário de Brasília. Fora desse período a promoção não aparece, mesmo ligada. Deixe em branco para não ter
          data.
        </p>
        {(["startsAt", "endsAt"] as const).map((key) => (
          <Field key={key} id={key} label={key === "startsAt" ? "Começa em" : "Termina em"} error={err[key]}>
            <div className="flex gap-2">
              <input
                id={key}
                name={key}
                type="datetime-local"
                value={v[key]}
                onChange={(e) => set(key, e.target.value)}
                aria-invalid={!!err[key]}
                aria-describedby={describedBy(key)}
                className={`${inputClass} min-w-0 flex-1`}
              />
              {v[key] ? (
                <button
                  type="button"
                  onClick={() => set(key, "")}
                  className="mt-1.5 min-h-12 shrink-0 rounded-2xl px-3 text-[14px] font-semibold underline underline-offset-4"
                >
                  Limpar
                </button>
              ) : null}
            </div>
          </Field>
        ))}
      </fieldset>

      <Field id="position" label="Posição na página" hint="1 = primeira, logo abaixo do slogan.">
        <select
          id="position"
          name="position"
          value={v.position}
          onChange={(e) => set("position", Number(e.target.value))}
          aria-describedby="position-hint"
          className={inputClass}
        >
          {Array.from({ length: maxPosition }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}ª
            </option>
          ))}
        </select>
      </Field>

      <div className="mt-2 flex flex-col gap-3">
        <SubmitButton
          pendingText="Salvando…"
          className="min-h-14 rounded-[20px] bg-sunset text-[17px] font-bold text-raisin disabled:opacity-70"
        >
          Salvar
        </SubmitButton>
        <Link
          href={base}
          className="flex min-h-12 items-center justify-center rounded-[20px] text-[15px] font-semibold underline underline-offset-4"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
