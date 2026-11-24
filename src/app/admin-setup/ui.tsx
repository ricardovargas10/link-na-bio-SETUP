"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Trash2 } from "lucide-react";
import { btnDanger, btnSecondary } from "./styles";

/** Botão que fica desativado enquanto o pedido está sendo enviado. */
export function SubmitButton({
  children,
  pendingText,
  ...props
}: ComponentProps<"button"> & { pendingText?: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || props.disabled} aria-busy={pending} {...props}>
      {pending && pendingText ? (
        <>
          <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> {pendingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * Exclusão em dois passos, dentro da própria tela (sem alerta do navegador).
 * O primeiro toque mostra a pergunta; "Sim, excluir" envia.
 */
export function ConfirmDelete({
  action,
  name,
  detail,
  compact,
}: {
  action: (formData: FormData) => void | Promise<void>;
  name: string;
  detail: string;
  /** Só o ícone da lixeira no gatilho. */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Excluir "${name}"`}
        className={compact ? "ml-auto inline-flex size-11 items-center justify-center rounded-xl text-danger hover:bg-danger-bg" : btnDanger}
      >
        <Trash2 className="size-[18px]" aria-hidden />
        {compact ? null : "Excluir"}
      </button>
    );
  }
  return (
    <div data-confirm="true" className="w-full basis-full rounded-[14px] border-[1.5px] border-[#f0d4d2] bg-[#fffafa] p-3.5">
      <p className="text-[15px] font-semibold">Excluir &quot;{name}&quot;?</p>
      <p className="mt-1 text-[13.5px] leading-snug text-admin-muted">{detail} Não dá para desfazer.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <form action={action}>
          <SubmitButton pendingText="Excluindo…" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-danger px-4 text-[15px] font-semibold text-white aria-busy:opacity-75">
            Sim, excluir
          </SubmitButton>
        </form>
        <button type="button" onClick={() => setOpen(false)} className={btnSecondary}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
