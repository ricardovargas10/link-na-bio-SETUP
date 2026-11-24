"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ADMIN_PATH } from "@/lib/api";
import { NO_COLORS } from "@/lib/content-types";
import { isoToSpLocal } from "@/lib/time";
import { useAdmin } from "../AdminData";
import { ButtonForm, type ButtonFormValues } from "../ButtonForm";
import { Alert } from "../fields";
import { ListSkeleton } from "../Skeleton";

function Editor() {
  const id = useSearchParams().get("id") ?? "novo";
  const { data } = useAdmin();
  if (data === null) return <ListSkeleton />;
  if (data === "erro") return <Alert kind="error">Não consegui carregar agora. Atualize a página em instantes.</Alert>;

  const list = data.buttons;
  const isNew = id === "novo";
  const index = isNew ? -1 : list.findIndex((b) => b.id === id);
  if (!isNew && index < 0) {
    return (
      <div className="flex flex-col gap-4">
        <Alert kind="warning">Esse botão não existe mais.</Alert>
        <Link href={`${ADMIN_PATH}/`} className="text-[15px] font-semibold underline underline-offset-4">
          ← Voltar para os botões
        </Link>
      </div>
    );
  }
  const b = isNew ? null : list[index];

  const initial: ButtonFormValues = b
    ? {
        id: b.id,
        label: b.label,
        subtitle: b.subtitle ?? "",
        url: b.url,
        icon: b.icon,
        style: b.style,
        colors: b.colors,
        gapBefore: b.gapBefore,
        groupTitle: b.groupTitle ?? "",
        half: b.half,
        animation: b.animation,
        badge: b.badge ?? "",
        visible: b.visible,
        startsAt: isoToSpLocal(b.startsAt),
        endsAt: isoToSpLocal(b.endsAt),
        position: index + 1,
      }
    : {
        label: "",
        subtitle: "",
        url: "",
        icon: { type: "lib", name: "link" },
        style: "white",
        colors: NO_COLORS,
        gapBefore: false,
        groupTitle: "",
        half: false,
        animation: "none",
        badge: "",
        visible: true,
        startsAt: "",
        endsAt: "",
        position: 1,
      };

  // A key troca o formulário inteiro ao abrir outro botão.
  return <ButtonForm key={id} title={b ? "Editar botão" : "Novo botão"} initial={initial} maxPosition={isNew ? list.length + 1 : list.length} />;
}

export default function ButtonEditPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <Editor />
    </Suspense>
  );
}
