"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, use, useCallback, useEffect, useState, type ReactNode } from "react";
import { ADMIN_PATH, NotLoggedIn, getSession, loadAdminData } from "@/lib/api";
import type { AdminData } from "@/lib/content-types";

type Ctx = {
  /** null = ainda carregando; "erro" = não consegui carregar. */
  data: AdminData | null | "erro";
  user: string | null;
  /** Recarrega tudo da API (depois de salvar algo). */
  reload: () => Promise<void>;
  /** Roda uma ação; se a sessão caiu, leva ao login; no fim recarrega os dados. */
  run: <T>(fn: () => Promise<T>) => Promise<T>;
};

const AdminContext = createContext<Ctx | null>(null);

export function useAdmin(): Ctx {
  const ctx = use(AdminContext);
  if (!ctx) throw new Error("useAdmin fora do painel");
  return ctx;
}

/**
 * Guarda a sessão e os dados do painel. Sem sessão, manda para o login.
 * Fica no layout, então trocar de aba não recarrega nada à toa.
 */
export function AdminProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const onLogin = path.startsWith(`${ADMIN_PATH}/login`);
  const [user, setUser] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [data, setData] = useState<AdminData | null | "erro">(null);

  const toLogin = useCallback(() => {
    setUser(null);
    setData(null);
    router.replace(`${ADMIN_PATH}/login/`);
  }, [router]);

  const reload = useCallback(async () => {
    try {
      const d = await loadAdminData();
      setData(d ?? "erro");
    } catch (e) {
      if (e instanceof NotLoggedIn) toLogin();
      else setData("erro");
    }
  }, [toLogin]);

  const run = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      try {
        return await fn();
      } catch (e) {
        if (e instanceof NotLoggedIn) toLogin();
        throw e;
      } finally {
        await reload();
      }
    },
    [reload, toLogin],
  );

  useEffect(() => {
    let alive = true;
    void getSession().then(async (s) => {
      if (!alive) return;
      setChecked(true);
      if (s) {
        setUser(s.user);
        if (onLogin) router.replace(`${ADMIN_PATH}/`);
        else await reload();
      } else if (!onLogin) {
        toLogin();
      }
    });
    return () => {
      alive = false;
    };
    // Só na entrada no painel e ao sair/entrar da tela de login.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onLogin]);

  if (!checked && !onLogin) return null;
  return <AdminContext value={{ data, user, reload, run }}>{children}</AdminContext>;
}
