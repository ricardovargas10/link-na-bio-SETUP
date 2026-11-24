"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { ADMIN_PATH, logout } from "@/lib/api";

const TABS = [
  { href: `${ADMIN_PATH}/`, label: "Botões", match: (sub: string) => sub === "" || sub.startsWith("/botao") },
  { href: `${ADMIN_PATH}/redes/`, label: "Redes", match: (sub: string) => sub.startsWith("/rede") },
  { href: `${ADMIN_PATH}/pagina/`, label: "Página", match: (sub: string) => sub.startsWith("/pagina") },
];

/** Barra do painel: marca, "Ver página", Sair e as abas. Some no login e nas telas de edição. */
export function AdminNav() {
  const router = useRouter();
  const sub = usePathname().slice(ADMIN_PATH.length).replace(/\/$/, "");
  if (sub.startsWith("/login") || sub.startsWith("/botao") || sub.startsWith("/rede/") || sub === "/rede") return null;

  return (
    <header className="border-b border-[#e9e2e4] bg-white">
      <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-3 px-4 pt-3">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/icon.png" alt="" className="size-7 rounded-lg" />
          <span className="text-[15px] font-semibold">Link na bio · Set Up</span>
        </div>
        <div className="flex items-center gap-1">
          <a href="/" target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-1 rounded-xl px-2.5 text-[14.5px] font-semibold hover:bg-raisin/5">
            Ver página <ArrowUpRight className="size-4" aria-hidden />
          </a>
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.replace(`${ADMIN_PATH}/login/`);
            }}
            className="min-h-11 rounded-xl px-2.5 text-[14.5px] font-medium text-admin-muted hover:bg-raisin/5"
          >
            Sair
          </button>
        </div>
      </div>
      <nav aria-label="Seções do painel" className="mx-auto flex w-full max-w-xl gap-5 px-4">
        {TABS.map((t) => {
          const active = t.match(sub);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center text-[15px] ${active ? "font-semibold text-raisin shadow-[inset_0_-3px_0_#f05924]" : "font-medium text-admin-muted"}`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
