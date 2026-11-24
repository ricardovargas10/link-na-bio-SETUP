"use client";

import { ArrowUpDown, GripVertical } from "lucide-react";
import { useLayoutEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { reorderButtons } from "@/lib/api";
import { useAdmin } from "./AdminData";
import { Alert } from "./fields";

type Item = {
  id: string;
  label: string;
  /** null = sem separador; "" = separador sem título; texto = título do grupo. */
  separator: string | null;
  header: ReactNode;
  body: ReactNode;
};

/**
 * Lista única do painel, na mesma ordem da página. Arraste pela alça (mouse ou dedo).
 * A tela muda na hora; se o salvamento falhar, volta a ordem anterior e avisa.
 */
export function SortableButtons({ items: initial }: { items: Item[] }) {
  const { run } = useAdmin();
  const [items, setItems] = useState(initial);
  const [dragging, setDragging] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [, startTransition] = useTransition();
  const refs = useRef(new Map<string, HTMLLIElement>());
  const latest = useRef(items);
  useLayoutEffect(() => {
    latest.current = items;
  }, [items]);

  function onPointerDown(e: React.PointerEvent, id: string) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(id);
    setFailed(false);
    const before = latest.current;

    const move = (ev: PointerEvent) => {
      const list = latest.current;
      const from = list.findIndex((x) => x.id === id);
      // Nova posição = quantos outros cartões têm o meio acima do dedo/mouse.
      const to = list.filter((x) => {
        if (x.id === id) return false;
        const r = refs.current.get(x.id)?.getBoundingClientRect();
        return !!r && r.top + r.height / 2 < ev.clientY;
      }).length;
      if (to === from) return;
      const next = [...list];
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      latest.current = next;
      setItems(next);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      setDragging(null);
      const now = latest.current;
      if (now.map((x) => x.id).join() === before.map((x) => x.id).join()) return;
      startTransition(async () => {
        try {
          await run(() => reorderButtons(now.map((x) => x.id)));
        } catch {
          latest.current = before;
          setItems(before);
          setFailed(true);
        }
      });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }

  return (
    <div className="mt-6">
      {failed ? (
        <div className="mb-4">
          <Alert kind="warning">Não consegui salvar a nova ordem. A lista voltou como estava; tente de novo.</Alert>
        </div>
      ) : null}
      <ol className="flex flex-col gap-3">
        {items.map((it, i) => (
          <li
            key={it.id}
            ref={(el) => {
              if (el) refs.current.set(it.id, el);
              else refs.current.delete(it.id);
            }}
          >
            {i > 0 && it.separator !== null ? (
              <div className="mb-3 flex items-center gap-3 text-[12.5px] font-semibold text-admin-faint">
                <span aria-hidden className="h-0 flex-1 border-t-[1.5px] border-dashed border-admin-border" />
                <span className="inline-flex items-center gap-1">
                  <ArrowUpDown className="size-3.5" aria-hidden />
                  {it.separator ? `Grupo: ${it.separator}` : "Espaço acima · começa um grupo novo"}
                </span>
                <span aria-hidden className="h-0 flex-1 border-t-[1.5px] border-dashed border-admin-border" />
              </div>
            ) : null}
            <div
              className={`rounded-[18px] bg-white p-3.5 transition-[box-shadow,transform] has-[[data-confirm=true]]:border-[#f0d4d2] ${
                dragging === it.id
                  ? "relative z-10 -rotate-1 border-2 border-raisin shadow-[0_18px_32px_rgba(41,29,41,0.22)] motion-reduce:rotate-0"
                  : "border border-admin-line shadow-[0_1px_2px_rgba(41,29,41,0.05)]"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label={`Arrastar "${it.label}" para mudar a ordem`}
                  title="Arrastar para mudar a ordem"
                  onPointerDown={(e) => onPointerDown(e, it.id)}
                  className="-my-1.5 -ml-1.5 flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-xl text-[#9a8f9a] hover:bg-raisin/5 active:cursor-grabbing"
                >
                  <GripVertical className="size-5" aria-hidden />
                </button>
                {it.header}
              </div>
              {it.body}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
