"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "../actions";
import { SubmitButton } from "../ui";

const input =
  "mt-1.5 block w-full min-h-12 rounded-2xl border-2 border-raisin/25 bg-white px-4 text-[16px] outline-none focus:border-raisin";

export function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-5" noValidate>
      {state.error ? (
        <p role="alert" className="rounded-2xl bg-sunset/15 px-4 py-3 text-[15px] font-semibold">
          {state.error}
        </p>
      ) : null}
      <label className="block text-[15px] font-semibold">
        Usuário
        <input
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={100}
          className={input}
        />
      </label>
      <label className="block text-[15px] font-semibold">
        Senha
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={200}
          className={input}
        />
      </label>
      <SubmitButton
        pendingText="Entrando…"
        className="mt-2 min-h-14 rounded-[20px] bg-raisin text-[17px] font-semibold text-shell disabled:opacity-70"
      >
        Entrar
      </SubmitButton>
    </form>
  );
}
