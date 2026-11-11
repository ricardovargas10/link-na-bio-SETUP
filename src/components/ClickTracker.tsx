"use client";

import { useEffect } from "react";

/** Conta cliques nos botões e redes (links com data-track) sem atrasar a abertura do link. */
export function ClickTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[data-track]");
      const id = a?.getAttribute("data-track");
      if (!id) return;
      try {
        const body = new Blob([JSON.stringify({ id })], { type: "application/json" });
        if (!navigator.sendBeacon?.("/api/clique", body)) {
          void fetch("/api/clique", { method: "POST", body, keepalive: true });
        }
      } catch {
        /* o clique segue normalmente */
      }
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
