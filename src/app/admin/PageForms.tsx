"use client";

import { useActionState, useRef, useState } from "react";
import { Highlight } from "@/components/Highlight";
import { LIMITS, renderFooter, splitHeadline, type PageData } from "@/lib/content-types";
import { saveLogoAction, savePageAction, type FormState } from "./actions";
import { Field, FormAlert, inputClass } from "./fields";
import { SubmitButton } from "./ui";

export function TextsForm({ initial }: { initial: PageData }) {
  const [state, formAction] = useActionState<FormState, FormData>(savePageAction, {});
  const [v, setV] = useState(initial);
  const set = (k: keyof PageData, value: string) => setV((o) => ({ ...o, [k]: value }));
  const err = state.fieldErrors ?? {};
  const [before, hl, after] = splitHeadline(v.headline, v.highlight);
  const hlMissing = !!v.highlight.trim() && !v.headline.includes(v.highlight.trim());

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <FormAlert error={state.error} ok={state.ok ? "Textos salvos. A página já foi atualizada." : null} />

      <div className="rounded-3xl border-2 border-raisin/10 bg-shell px-4 py-5 text-center">
        <p className="text-[22px] leading-[1.2] font-extrabold tracking-[-0.03em] text-balance">
          {before}
          {hl ? <Highlight>{hl}</Highlight> : null}
          {after}
        </p>
      </div>

      <Field id="headline" label="Texto de cima" count={v.headline.length} max={LIMITS.headline} error={err.headline}>
        <textarea id="headline" name="headline" rows={2} value={v.headline} onChange={(e) => set("headline", e.target.value)} maxLength={LIMITS.headline} className={`${inputClass} py-3`} />
      </Field>

      <Field
        id="highlight"
        label="Trecho na caixa azul"
        hint="Copie aqui uma parte do texto de cima, igualzinha. Deixe vazio para não ter destaque."
        count={v.highlight.length}
        max={LIMITS.highlight}
        error={err.highlight ?? (hlMissing ? "Esse trecho não está no texto de cima." : undefined)}
      >
        <input id="highlight" name="highlight" value={v.highlight} onChange={(e) => set("highlight", e.target.value)} maxLength={LIMITS.highlight} className={inputClass} />
      </Field>

      <Field id="aboutTitle" label="Título do texto de baixo" count={v.aboutTitle.length} max={LIMITS.aboutTitle} error={err.aboutTitle}>
        <input id="aboutTitle" name="aboutTitle" value={v.aboutTitle} onChange={(e) => set("aboutTitle", e.target.value)} maxLength={LIMITS.aboutTitle} className={inputClass} />
      </Field>

      <Field id="aboutText" label="Texto de baixo" hint="Deixe vazio para esconder." count={v.aboutText.length} max={LIMITS.aboutText} error={err.aboutText}>
        <textarea id="aboutText" name="aboutText" rows={5} value={v.aboutText} onChange={(e) => set("aboutText", e.target.value)} maxLength={LIMITS.aboutText} className={`${inputClass} py-3`} />
      </Field>

      <Field
        id="footer"
        label="Rodapé"
        hint={`Escreva {ano} para mostrar o ano atual. Fica assim: ${renderFooter(v.footer || " ", new Date().getFullYear())}`}
        count={v.footer.length}
        max={LIMITS.footer}
        error={err.footer}
      >
        <input id="footer" name="footer" value={v.footer} onChange={(e) => set("footer", e.target.value)} maxLength={LIMITS.footer} className={inputClass} />
      </Field>

      <SubmitButton pendingText="Salvando…" className="min-h-14 rounded-[20px] bg-sunset text-[17px] font-bold text-raisin disabled:opacity-70">
        Salvar textos
      </SubmitButton>
    </form>
  );
}

export function LogoForm({ logoMediaId, resetAction }: { logoMediaId: string | null; resetAction: () => Promise<void> }) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [state, formAction] = useActionState<FormState, FormData>(async (prev, fd) => {
    const result = await saveLogoAction(prev, fd);
    if (result.ok) setFileUrl(null); // salvo: volta a mostrar o logo do site
    return result;
  }, {});
  const [fileError, setFileError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const current = fileUrl ?? (logoMediaId ? `/media/${logoMediaId}` : "/brand/logo.png");

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <FormAlert error={fileError ?? state.error} ok={state.ok && !fileUrl ? "Logo salvo. A página já foi atualizada." : null} />
        <div className="flex min-h-28 items-center justify-center rounded-3xl border-2 border-raisin/10 bg-shell p-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current} alt="Logo atual" className="max-h-20 w-auto max-w-[220px] object-contain" />
        </div>
        <input
          ref={input}
          type="file"
          name="logoFile"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            setFileError(null);
            const f = e.target.files?.[0];
            if (!f) return;
            if (f.size > 600 * 1024) {
              setFileError("A imagem pode ter no máximo 600 KB.");
              return;
            }
            setFileUrl(URL.createObjectURL(f));
          }}
        />
        <button type="button" onClick={() => input.current?.click()} className="min-h-12 rounded-[18px] border-2 border-raisin/25 bg-white text-[16px] font-semibold">
          {fileUrl ? "Escolher outra imagem" : "Escolher imagem do logo"}
        </button>
        {fileUrl ? (
          <SubmitButton pendingText="Salvando…" className="min-h-12 rounded-[18px] bg-raisin text-[16px] font-semibold text-shell disabled:opacity-70">
            Salvar este logo
          </SubmitButton>
        ) : null}
        <p className="text-[13px] text-raisin/70">PNG, JPG, WEBP ou SVG, até 600 KB. De preferência com fundo transparente.</p>
      </form>
      {logoMediaId && !fileUrl ? (
        <form action={resetAction}>
          <SubmitButton className="min-h-11 w-full rounded-[18px] text-[15px] font-semibold underline underline-offset-4">
            Voltar ao logo original
          </SubmitButton>
        </form>
      ) : null}
    </div>
  );
}
