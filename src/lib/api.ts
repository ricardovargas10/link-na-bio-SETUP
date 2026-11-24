/**
 * Conversa do painel com a API em PHP (php/api/index.php).
 * Toda chamada leva o cookie de sessão; as que mudam algo levam também o token CSRF.
 */
import type { AdminData } from "./content-types";

export const ADMIN_PATH = "/admin-setup";
const API = "/api/";

export type FormState = { error?: string; ok?: boolean; fieldErrors?: Record<string, string> };
export type LoginState = { error?: string };

type ApiResult<T = unknown> = { ok: true; data?: T } | { ok: false; error?: string; fieldErrors?: Record<string, string> };

/** Sessão expirada ou ausente: a tela leva de volta para o login. */
export class NotLoggedIn extends Error {
  constructor() {
    super("Sessão expirada");
  }
}

let csrfToken = "";

export function setCsrf(token: string) {
  csrfToken = token;
}

const NETWORK_ERROR = "Não consegui falar com o servidor. Confira a internet e tente de novo.";

async function call<T>(action: string, body?: FormData | Record<string, unknown>): Promise<ApiResult<T>> {
  const init: RequestInit = { credentials: "same-origin", headers: { Accept: "application/json" } };
  if (body !== undefined) {
    init.method = "POST";
    init.headers = { ...init.headers, "X-CSRF-Token": csrfToken };
    if (body instanceof FormData) init.body = body;
    else {
      init.body = JSON.stringify(body);
      (init.headers as Record<string, string>)["Content-Type"] = "application/json";
    }
  }
  let res: Response;
  try {
    res = await fetch(`${API}?a=${encodeURIComponent(action)}`, init);
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
  if (res.status === 401) throw new NotLoggedIn();
  try {
    return (await res.json()) as ApiResult<T>;
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
}

function asForm(r: ApiResult): FormState {
  if (r.ok) return { ok: true };
  return { error: r.error ?? "Não foi possível salvar agora. Tente de novo em instantes.", fieldErrors: r.fieldErrors };
}

/** Lança erro (para a tela avisar) quando uma ação rápida falha. */
function must(r: ApiResult): void {
  if (!r.ok) throw new Error(r.error ?? "Falhou");
}

// ---------- Sessão ----------

export async function getSession(): Promise<{ user: string; csrf: string } | null> {
  try {
    const r = await call<{ user: string; csrf: string }>("sessao");
    if (r.ok && r.data) {
      setCsrf(r.data.csrf);
      return r.data;
    }
  } catch {
    /* sem sessão */
  }
  return null;
}

export async function login(fd: FormData): Promise<LoginState & { ok?: boolean }> {
  try {
    const r = await call<{ csrf: string }>("login", fd);
    if (r.ok) {
      if (r.data?.csrf) setCsrf(r.data.csrf);
      return { ok: true };
    }
    return { error: r.error ?? "Usuário ou senha incorretos" };
  } catch {
    return { error: "Usuário ou senha incorretos" };
  }
}

export async function logout(): Promise<void> {
  try {
    await call("sair", {});
  } catch {
    /* já estava fora */
  }
  setCsrf("");
}

// ---------- Dados do painel ----------

export async function loadAdminData(): Promise<AdminData | null> {
  const r = await call<Omit<AdminData, "loadedAt">>("dados");
  return r.ok && r.data ? { ...r.data, loadedAt: Date.now() } : null;
}

// ---------- Botões ----------

export const saveButton = async (fd: FormData) => asForm(await call("botao-salvar", fd));
export const toggleButton = async (id: string) => must(await call("botao-mostrar", { id }));
export const moveButton = async (id: string, dir: "up" | "down") => must(await call("botao-mover", { id, dir }));
export const reorderButtons = async (ids: string[]) => must(await call("botao-ordem", { ids }));
export const duplicateButton = async (id: string) => must(await call("botao-duplicar", { id }));
export const deleteButton = async (id: string) => must(await call("botao-excluir", { id }));

// ---------- Redes ----------

export const saveSocial = async (fd: FormData) => asForm(await call("rede-salvar", fd));
export const toggleSocial = async (id: string) => must(await call("rede-mostrar", { id }));
export const moveSocial = async (id: string, dir: "up" | "down") => must(await call("rede-mover", { id, dir }));
export const deleteSocial = async (id: string) => must(await call("rede-excluir", { id }));

// ---------- Página ----------

export const savePage = async (fd: FormData) => asForm(await call("pagina-salvar", fd));
export const saveLogo = async (fd: FormData) => asForm(await call("logo-salvar", fd));
export const resetLogo = async () => must(await call("logo-original", {}));
