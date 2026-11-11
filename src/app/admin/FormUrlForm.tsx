"use client";

import { useActionState } from "react";
import { saveFormUrlAction, type SettingsState } from "./actions";
import { SubmitButton } from "./ui";

export function FormUrlForm({ initialUrl }: { initialUrl: string }) {
  const [state, formAction] = useActionState<SettingsState, FormData>(saveFormUrlAction, {});

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-3" noValidate>
      <label htmlFor="formUrl" className="text-[15px] font-semibold">
        Link do botão &ldquo;Preencha o formulário de interesse&rdquo;
      </label>
      <input
        id="formUrl"
        name="formUrl"
        type="url"
        inputMode="url"
        autoCapitalize="none"
        spellCheck={false}
        defaultValue={initialUrl}
        placeholder="https://"
        required
        aria-invalid={!!state.error}
        aria-describedby="formUrl-msg"
        className="block min-h-12 w-full rounded-2xl border-2 border-raisin/25 bg-white px-4 text-[16px] outline-none focus:border-raisin aria-[invalid=true]:border-[#B3261E]"
      />
      <p id="formUrl-msg" role="status" className="min-h-5 text-[14px] font-semibold">
        {state.error ? (
          <span className="text-[#B3261E]">{state.error}</span>
        ) : state.ok ? (
          <span className="text-[#1E7A3C]">Link salvo. A página já foi atualizada.</span>
        ) : null}
      </p>
      <SubmitButton
        pendingText="Salvando…"
        className="min-h-12 rounded-[18px] bg-raisin text-[16px] font-semibold text-shell disabled:opacity-70"
      >
        Salvar link
      </SubmitButton>
    </form>
  );
}
