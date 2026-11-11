"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { LinkCard } from "@/components/LinkCard";
import {
  ANIMATIONS,
  ANIMATION_LABELS,
  BUTTON_STYLES,
  LIMITS,
  STYLE_LABELS,
  type Animation,
  type ButtonStyle,
  type IconRef,
} from "@/lib/content-types";
import { saveButtonAction, type FormState } from "./actions";
import { Field, FormAlert, Toggle, inputClass } from "./fields";
import { IconPicker, choiceToPreview, initialChoice } from "./IconPicker";
import { SubmitButton } from "./ui";

export type ButtonFormValues = {
  id?: string;
  label: string;
  subtitle: string;
  url: string;
  icon: IconRef;
  style: ButtonStyle;
  animation: Animation;
  badge: string;
  visible: boolean;
  startsAt: string; // "AAAA-MM-DDTHH:mm" no horário de Brasília, ou ""
  endsAt: string;
  position: number;
};

const SWATCH: Record<ButtonStyle, string> = {
  white: "bg-white border border-raisin/20",
  orange: "bg-sunset",
  blue: "bg-sky",
  lilac: "bg-lilac",
  purple: "bg-raisin",
};

const choiceTile =
  "flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl border-2 bg-white px-3 text-[15px] font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-sunset";

export function ButtonForm({ base, initial, maxPosition }: { base: string; initial: ButtonFormValues; maxPosition: number }) {
  const [state, formAction] = useActionState<FormState, FormData>(saveButtonAction, {});
  const [v, setV] = useState(initial);
  const [iconChoice, setIconChoice] = useState(initialChoice(initial.icon));
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const set = <K extends keyof ButtonFormValues>(key: K, value: ButtonFormValues[K]) => setV((o) => ({ ...o, [key]: value }));
  const err = state.fieldErrors ?? {};
  const preview = choiceToPreview(iconChoice, initial.icon, fileUrl);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-6" noValidate>
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <FormAlert error={state.error} />

      <div className="sticky top-0 z-20 -mx-4 border-b border-raisin/10 bg-shell/95 px-4 pt-3 pb-5 backdrop-blur">
        <p className="mb-4 text-[13px] font-semibold tracking-wide text-raisin/70 uppercase">Como vai ficar</p>
        <LinkCard
          preview
          label={v.label}
          subtitle={v.subtitle}
          badge={v.badge}
          url={v.url}
          icon={preview.icon}
          iconPreviewSrc={preview.src}
          style={v.style}
          animation={v.animation}
        />
      </div>

      <Field id="label" label="Texto do botão" count={v.label.length} max={LIMITS.label} error={err.label}>
        <input id="label" name="label" value={v.label} onChange={(e) => set("label", e.target.value)} maxLength={LIMITS.label} aria-invalid={!!err.label} className={inputClass} />
      </Field>

      <Field id="url" label="Link" hint="Comece com https://, wa.me/, mailto: ou tel:" error={err.url}>
        <input
          id="url"
          name="url"
          type="url"
          inputMode="url"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="https://"
          value={v.url}
          onChange={(e) => set("url", e.target.value)}
          aria-invalid={!!err.url}
          className={inputClass}
        />
      </Field>

      <IconPicker
        current={initial.icon}
        error={err.icon}
        onChange={(c, url) => {
          setIconChoice(c);
          setFileUrl(url);
        }}
      />

      <fieldset>
        <legend className="text-[15px] font-semibold">Estilo</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {BUTTON_STYLES.map((s) => (
            <label key={s} className={`${choiceTile} ${v.style === s ? "border-raisin" : "border-raisin/15"}`}>
              <input type="radio" name="style" value={s} checked={v.style === s} onChange={() => set("style", s)} className="sr-only" />
              <span className={`size-5 rounded-full ${SWATCH[s]}`} aria-hidden />
              {STYLE_LABELS[s]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-[15px] font-semibold">Animação</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {ANIMATIONS.map((a) => (
            <label key={a} className={`${choiceTile} ${v.animation === a ? "border-raisin" : "border-raisin/15"}`}>
              <input type="radio" name="animation" value={a} checked={v.animation === a} onChange={() => set("animation", a)} className="sr-only" />
              {ANIMATION_LABELS[a]}
            </label>
          ))}
        </div>
        <p className="mt-1.5 text-[13px] text-raisin/70">Use animação para destacar uma promoção ou novidade.</p>
      </fieldset>

      <Field id="subtitle" label="Subtítulo (opcional)" count={v.subtitle.length} max={LIMITS.subtitle} error={err.subtitle}>
        <input id="subtitle" name="subtitle" value={v.subtitle} onChange={(e) => set("subtitle", e.target.value)} maxLength={LIMITS.subtitle} className={inputClass} />
      </Field>

      <Field
        id="badge"
        label="Selo (opcional)"
        hint='Etiqueta no canto do botão. Ex.: "Novo", "Vagas abertas".'
        count={v.badge.length}
        max={LIMITS.badge}
        error={err.badge}
      >
        <input id="badge" name="badge" value={v.badge} onChange={(e) => set("badge", e.target.value)} maxLength={LIMITS.badge} className={inputClass} />
      </Field>

      <Toggle name="visible" checked={v.visible} onChange={(x) => set("visible", x)} title="Mostrar na página" description="Desligado, o botão fica oculto (não é apagado)." />

      <fieldset className="flex flex-col gap-4">
        <legend className="text-[15px] font-semibold">Datas (opcional)</legend>
        <p className="mt-1 text-[13px] text-raisin/70">Horário de Brasília. Fora desse período o botão some sozinho. Deixe em branco para não ter data.</p>
        {(["startsAt", "endsAt"] as const).map((key) => (
          <Field key={key} id={key} label={key === "startsAt" ? "Aparece a partir de" : "Some depois de"} error={err[key]}>
            <div className="flex gap-2">
              <input id={key} name={key} type="datetime-local" value={v[key]} onChange={(e) => set(key, e.target.value)} aria-invalid={!!err[key]} className={`${inputClass} min-w-0 flex-1`} />
              {v[key] ? (
                <button type="button" onClick={() => set(key, "")} className="mt-1.5 min-h-12 shrink-0 rounded-2xl px-3 text-[14px] font-semibold underline underline-offset-4">
                  Limpar
                </button>
              ) : null}
            </div>
          </Field>
        ))}
      </fieldset>

      <Field id="position" label="Posição na página" hint="1 = primeiro botão.">
        <select id="position" name="position" value={v.position} onChange={(e) => set("position", Number(e.target.value))} className={inputClass}>
          {Array.from({ length: maxPosition }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}º
            </option>
          ))}
        </select>
      </Field>

      <div className="mt-2 flex flex-col gap-3">
        <SubmitButton pendingText="Salvando…" className="min-h-14 rounded-[20px] bg-sunset text-[17px] font-bold text-raisin disabled:opacity-70">
          Salvar botão
        </SubmitButton>
        <Link href={base} className="flex min-h-12 items-center justify-center rounded-[20px] text-[15px] font-semibold underline underline-offset-4">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
