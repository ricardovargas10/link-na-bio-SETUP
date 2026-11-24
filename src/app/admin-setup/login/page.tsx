"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { ADMIN_PATH, login, type LoginState } from "@/lib/api";
import { SubmitButton } from "../ui";
import { Alert, inputClass as input } from "../fields";
import { btnPrimary } from "../styles";

export default function LoginPage() {
  const router = useRouter();
  // O React limpa o formulário depois de enviar; o usuário fica guardado aqui para não ter que digitar de novo.
  const [username, setUsername] = useState("");
  const [state, formAction] = useActionState<LoginState, FormData>(async (_prev, fd) => {
    const r = await login(fd);
    if (r.ok) router.replace(`${ADMIN_PATH}/`);
    return r;
  }, {});

  return (
    <div className="mx-auto max-w-sm pt-10">
      <div className="rounded-[18px] border border-admin-line bg-white p-5 shadow-[0_1px_2px_rgba(41,29,41,0.05)] sm:p-6">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/icon.png" alt="" className="size-8 rounded-lg" />
          <h1 className="text-[19px] leading-tight font-bold">Painel do link na bio</h1>
        </div>
        <p className="mt-2 text-[14px] text-admin-muted">Use o usuário e a senha que você recebeu.</p>

        <form action={formAction} className="mt-5 flex flex-col gap-4" noValidate>
          {state.error ? <Alert kind="error">{state.error}</Alert> : null}
          <label className="block text-[14.5px] font-semibold">
            Usuário
            <input
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              maxLength={100}
              className={input}
            />
          </label>
          <label className="block text-[14.5px] font-semibold">
            Senha
            <input name="password" type="password" autoComplete="current-password" required maxLength={200} className={input} />
          </label>
          <SubmitButton pendingText="Entrando…" className={`${btnPrimary} mt-1 w-full`}>
            Entrar
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
