"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { BrandIcon } from "@/components/BrandIcon";
import { LIMITS, type IconRef } from "@/lib/content-types";
import { ICON_LABELS } from "@/lib/icon-names";
import { saveSocialAction, type FormState } from "./actions";
import { Field, FormAlert, Toggle, inputClass } from "./fields";
import { IconPicker, choiceToPreview, initialChoice } from "./IconPicker";
import { SubmitButton } from "./ui";

export type SocialFormValues = { id?: string; label: string; url: string; icon: IconRef; visible: boolean };

export function SocialForm({ base, initial }: { base: string; initial: SocialFormValues }) {
  const [state, formAction] = useActionState<FormState, FormData>(saveSocialAction, {});
  const [v, setV] = useState(initial);
  const [iconChoice, setIconChoice] = useState(initialChoice(initial.icon));
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const err = state.fieldErrors ?? {};
  const preview = choiceToPreview(iconChoice, initial.icon, fileUrl);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-6" noValidate>
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <FormAlert error={state.error} />

      <div className="flex items-center gap-3 rounded-3xl border-2 border-raisin/10 bg-white/80 p-4">
        <span className="flex size-12 items-center justify-center rounded-full bg-shell text-raisin">
          <BrandIcon icon={preview.icon} previewSrc={preview.src} className="size-[26px]" />
        </span>
        <span className="text-[15px] font-semibold">{v.label || "Nome da rede"}</span>
      </div>

      <IconPicker
        current={initial.icon}
        allowNone={false}
        error={err.icon}
        onChange={(c, url) => {
          setIconChoice(c);
          setFileUrl(url);
          // Preenche o nome sozinho quando escolhe uma rede da lista e o nome está vazio ou era o de outra rede.
          if (c.startsWith("lib:")) {
            const name = ICON_LABELS[c.slice(4) as keyof typeof ICON_LABELS];
            setV((o) => (!o.label || Object.values(ICON_LABELS).includes(o.label) ? { ...o, label: name } : o));
          }
        }}
      />

      <Field id="label" label="Nome da rede" hint="Aparece para leitores de tela e ao passar o mouse." count={v.label.length} max={LIMITS.socialLabel} error={err.label}>
        <input id="label" name="label" value={v.label} onChange={(e) => setV((o) => ({ ...o, label: e.target.value }))} maxLength={LIMITS.socialLabel} className={inputClass} />
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
          onChange={(e) => setV((o) => ({ ...o, url: e.target.value }))}
          className={inputClass}
        />
      </Field>

      <Toggle name="visible" checked={v.visible} onChange={(x) => setV((o) => ({ ...o, visible: x }))} title="Mostrar na página" description="Desligado, o ícone fica oculto (não é apagado)." />

      <div className="mt-2 flex flex-col gap-3">
        <SubmitButton pendingText="Salvando…" className="min-h-14 rounded-[20px] bg-sunset text-[17px] font-bold text-raisin disabled:opacity-70">
          Salvar rede
        </SubmitButton>
        <Link href={`${base}/redes`} className="flex min-h-12 items-center justify-center rounded-[20px] text-[15px] font-semibold underline underline-offset-4">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
