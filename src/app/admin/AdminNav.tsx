"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_PATH } from "@/lib/admin-path";

// "sub" é o caminho depois do endereço do painel (no servidor ele aparece como /admin/...).
const TABS = [
  { href: ADMIN_PATH, label: "Botões", match: (sub: string) => sub === "" || sub.startsWith("/botao") },
  { href: `${ADMIN_PATH}/redes`, label: "Redes", match: (sub: string) => sub.startsWith("/rede") },
  { href: `${ADMIN_PATH}/pagina`, label: "Página", match: (sub: string) => sub.startsWith("/pagina") },
];

function subPath(path: string): string {
  for (const prefix of [ADMIN_PATH, "/admin"]) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return path.slice(prefix.length).replace(/\/$/, "");
  }
  return path;
}

/** Abas do painel (não aparecem na tela de login). */
export function AdminNav({ logout }: { logout: () => Promise<void> }) {
  const sub = subPath(usePathname());
  if (sub.startsWith("/login")) return null;
  return (
    <div className="mb-6 flex items-center justify-between gap-3">
      <nav aria-label="Seções do painel" className="flex gap-1 rounded-full bg-raisin/[0.06] p-1">
        {TABS.map((t) => {
          const active = t.match(sub);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-10 items-center rounded-full px-4 text-[15px] font-semibold ${active ? "bg-raisin text-shell" : "text-raisin"}`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      <form action={logout}>
        <button type="submit" className="min-h-10 rounded-full px-3 text-[15px] font-semibold underline underline-offset-4">
          Sair
        </button>
      </form>
    </div>
  );
}
